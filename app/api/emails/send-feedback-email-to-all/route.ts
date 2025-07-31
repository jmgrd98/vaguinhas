import { NextResponse } from "next/server";
// import { sendFeedbackEmail } from "@/lib/email";
import { getAllSubscribers } from "@/lib/mongodb";
// import sendBatchEmails from "@/lib/sendBatchEmails";
import isAuthorized from "@/utils/isAuthorized";
import isRateLimited from "@/utils/isRateLimited";
import shuffleArray from "@/utils/shuffleArray";
import { getEmailQueue } from "@/lib/emailQueue"; // Updated import

// Rate‑limiter (only in prod)


/** 
 * Returns true if this token has hit its 5‑call limit (30 min window).
 */


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
      name: `feedback-${Date.now()}-${email}`,
      data: { 
        email,
        jobType: 'feedback-email'  // Add this
      },
    }));
    await queue.addBulk(jobs);

    return NextResponse.json({
      message: `${jobs.length} emails queued for delivery`,
      recipients: randomizedEmails.length,
      // jobType: 'feedback-email',
    });
  } catch (error) {
    console.error("Queue processing failed:", error);
    return NextResponse.json(
      { error: "Email queueing error" },
      { status: 500 }
    );
  }
}