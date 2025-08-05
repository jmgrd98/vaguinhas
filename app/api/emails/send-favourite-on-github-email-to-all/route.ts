import { NextResponse } from "next/server";
import { getAllSubscribers } from "@/lib/mongodb";
import { getEmailQueue } from "@/lib/emailQueue";
import isAuthorized from "@/utils/isAuthorized";
import isRateLimited from "@/utils/isRateLimited";
import shuffleArray from "@/utils/shuffleArray";

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
 let queue;
    try {
      queue = getEmailQueue();
    } catch (error) {
      console.error("Queue initialization failed:", error);
      return NextResponse.json(
        { error: "Email queue initialization error" },
        { status: 500 }
      );
    }
    
    const jobs = randomizedEmails.map(email => ({
      name: 'favourite-on-github',
      data: { 
        email,
        // name: 'feedback-email',
        // jobType: 'feedback-email'  // Add this
      },
    }));
    await queue.addBulk(jobs);

    return NextResponse.json({
      message: `${jobs.length} emails queued for delivery`,
      recipients: randomizedEmails.length,
      // jobType: 'feedback-email',
    });
  } catch (error) {
    console.error("Background email processing failed:", error);
    return NextResponse.json(
      { error: "Background email processing error" },
      { status: 500 }
    );
  }
}