import { NextResponse } from "next/server";
import { sendFeedbackEmail } from "@/lib/email";
import { getAllSubscribers } from "@/lib/mongodb";
import sendBatchEmails from "@/lib/sendBatchEmails";
import { LRUCache } from "lru-cache";

// Rate‑limiter (only in prod)
const rateLimitCache =
  process.env.NODE_ENV === "production"
    ? new LRUCache<string, number[]>({
        max: 100,
        ttl: 30 * 60 * 1000, // 30 minutes
      })
    : null;

/** 
 * Returns true if this token has hit its 5‑call limit (30 min window).
 */
function isRateLimited(token: string, limit = 5) {
  if (!rateLimitCache || process.env.NODE_ENV !== "production") return false;

  const countArr = rateLimitCache.get(token) || [0];
  if (countArr[0] >= limit) return true;

  rateLimitCache.set(token, [countArr[0] + 1]);
  return false;
}

/**
 * Check bearer token against:
 *  - VERCEL’s CRON_SECRET (cron jobs)
 *  - Your JWT_SECRET         (manual or client calls)
 */
function isAuthorized(req: Request) {
  const header = req.headers.get("authorization") || "";
  const token = header.split(" ")[1] || "";
  const { CRON_SECRET, JWT_SECRET } = process.env;
  return (
    (CRON_SECRET && token === CRON_SECRET) ||
    (JWT_SECRET && token === JWT_SECRET)
  );
}

export async function GET(req: Request) {
  // 1) Auth
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2) Rate limit (prod only)
  const token = req.headers.get("authorization")!.split(" ")[1]!;
  if (isRateLimited(token)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in 30 minutes." },
      { status: 429 }
    );
  }

  try {
    // 3) Fetch subscribers in pages
    const allSubscribers: { email: string }[] = [];
    let page = 1;
    const pageSize = 500;
    let hasMore = true;

    while (hasMore) {
      console.log("Fetching subscribers page:", page);
      const { subscribers, total } = await getAllSubscribers(page, pageSize);
      allSubscribers.push(
        ...subscribers.map((s) => ({ email: s.email }))
      );
      hasMore = page * pageSize < total;
      page++;
    }

    const emails = allSubscribers.map((s) => s.email).filter(Boolean);
    if (emails.length === 0) {
      return NextResponse.json(
        { error: "No valid subscribers found" },
        { status: 400 }
      );
    }

    // 4) Send emails (10 at a time, 1.5 s between batches)
    console.log(`Starting batch email sending to ${emails.length} recipients`);
    await sendBatchEmails(emails, sendFeedbackEmail, 10, 1500);

    return NextResponse.json(
      {
        message: `Emails processed for ${emails.length} recipients`,
        recipients: emails.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email batch processing failed:", error);
    return NextResponse.json(
      { error: "Email processing error" },
      { status: 500 }
    );
  }
}
