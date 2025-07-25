import { NextResponse } from "next/server";
import { sendFavouriteOnGithubEmail } from "@/lib/email";
import { getAllSubscribers } from "@/lib/mongodb";
import sendBatchEmails from "@/lib/sendBatchEmails";
import { LRUCache } from "lru-cache";

// Initialize rate limiter only in production
const rateLimitCache =
  process.env.NODE_ENV === "production"
    ? new LRUCache<string, number[]>({
        max: 100,
        ttl: 30 * 60 * 1000, // 30 minutes
      })
    : null;

/**
 * Return true if this token has hit the rate-limit.
 * Only enforced in production.
 */
function isRateLimited(token: string, limit = 5) {
  if (!rateLimitCache || process.env.NODE_ENV !== "production") return false;

  const tokenCount = rateLimitCache.get(token) || [0];
  if (tokenCount[0] >= limit) return true;

  rateLimitCache.set(token, [tokenCount[0] + 1]);
  return false;
}

/**
 * Validate incoming bearer token against:
 *  - CRON_SECRET (injected by Vercel on every cron call)
 *  - JWT_SECRET  (for any manual calls you might do)
 */
function isAuthorized(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.split(" ")[1] || "";
  const { CRON_SECRET, JWT_SECRET } = process.env;

  return (
    (CRON_SECRET && token === CRON_SECRET) ||
    (JWT_SECRET && token === JWT_SECRET)
  );
}

/**
 * Fisher-Yates shuffle algorithm to randomize array in-place
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]; // Create a copy to avoid mutating original
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function GET(req: Request) {
  // 1) Authenticate
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2) Rate-limit cron calls (only in prod)
  //    We key by the cron secret so each schedule counts separately
  const token = req.headers.get("authorization")!.split(" ")[1]!;
  if (isRateLimited(token)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in 30 minutes." },
      { status: 429 }
    );
  }

  try {
    // 3) Fetch all subscribers in pages
    let allSubscribers: { email: string }[] = [];
    let page = 1;
    const pageSize = 500;
    let hasMore = true;

    while (hasMore) {
      console.log("Fetching subscribers page:", page);
      const { subscribers, total } = await getAllSubscribers(page, pageSize);
      allSubscribers = [
        ...allSubscribers,
        ...subscribers.map((s) => ({ email: s.email })),
      ];
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

    // 4) Randomize the email list to avoid same users being affected on timeout
    const randomizedEmails = shuffleArray(emails);
    console.log(`Randomized ${randomizedEmails.length} email recipients`);
    console.log('Emails:', randomizedEmails);

    // 5) Send in batches
    console.log(`Starting email sending to ${randomizedEmails.length} recipients`);
    await sendBatchEmails(randomizedEmails, sendFavouriteOnGithubEmail, 10);

    return NextResponse.json(
      {
        message: `Emails sent to ${randomizedEmails.length} recipients`,
        recipients: randomizedEmails.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Background email processing failed:", error);
    return NextResponse.json(
      { error: "Background email processing error" },
      { status: 500 }
    );
  }
}