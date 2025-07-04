import { NextResponse } from "next/server";
import { sendFeedbackEmail } from "@/lib/email";
import { getAllSubscribers } from "@/lib/mongodb";
import sendBatchEmails from "@/lib/sendBatchEmails";

export async function GET() {
  try {
    let allEmails: string[] = [];
    let page = 1;
    const pageSize = 500; // Adjust based on your database performance
    let hasMore = true;

    // Paginated fetching to handle large datasets
    while (hasMore) {
      const { subscribers, total } = await getAllSubscribers(page, pageSize);
      const pageEmails = subscribers.map(s => s.email).filter(Boolean);
      
      allEmails = [...allEmails, ...pageEmails];
      
      // Check if we've fetched all subscribers
      hasMore = page * pageSize < total;
      page++;
      
      console.log(`Fetched page ${page-1}: ${pageEmails.length} emails (Total: ${allEmails.length})`);
    }

    if (!allEmails.length) {
      return NextResponse.json(
        { error: "No valid subscribers found" },
        { status: 400 }
      );
    }

    console.log(`Starting batch email sending to ${allEmails.length} recipients`);
    
    // Send with safe defaults (adjust based on your email provider's limits)
    await sendBatchEmails(allEmails, sendFeedbackEmail, 10, 1500);

    return NextResponse.json(
      { message: `Emails processed for ${allEmails.length} recipients` },
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