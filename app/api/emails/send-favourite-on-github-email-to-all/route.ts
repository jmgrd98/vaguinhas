import { NextResponse } from "next/server";
import { sendFavouriteOnGithubEmail } from "@/lib/email";
import { getAllSubscribers } from "@/lib/mongodb";
import sendBatchEmails from "@/lib/sendBatchEmails";

export async function GET() {
  try {
    // Get all subscribers with pagination support
    let allSubscribers: { email: string }[] = [];
    let page = 1;
    const pageSize = 500;
    let hasMore = true;

    while (hasMore) {
      console.log("STILL HAS MORE")
      const { subscribers, total } = await getAllSubscribers(page, pageSize);
      allSubscribers = [...allSubscribers, ...subscribers.map(s => ({ email: s.email }))];
      hasMore = page * pageSize < total;
      page++;
    }

    const emails = allSubscribers.map(s => s.email).filter(Boolean);
    
    if (!emails.length) {
      return NextResponse.json(
        { error: "No valid subscribers found" },
        { status: 400 }
      );
    }

    // Process emails in background
    console.log(`Starting email sending to ${emails.length} recipients`);
    await sendBatchEmails(emails, sendFavouriteOnGithubEmail, 10);

    return NextResponse.json(
      { message: `Emails sent to ${emails.length} recipients` },
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