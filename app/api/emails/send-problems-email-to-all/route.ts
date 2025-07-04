import { NextResponse } from "next/server";
import sendBatchEmails from "@/lib/sendBatchEmails";
import { sendProblemsEmail } from "@/lib/email";
import { getAllSubscribers } from "@/lib/mongodb";

// Production-safe rate limiting parameters
const PRODUCTION = process.env.NODE_ENV === "production";
const BATCH_SIZE = PRODUCTION ? 8 : 15; // Conservative in production
const BATCH_DELAY = PRODUCTION ? 2000 : 500; // Longer delay in production
const PAGE_SIZE = 300; // Database page size

export async function GET() {
  try {
    let totalEmails = 0;
    let page = 1;
    let hasMore = true;
    let allEmails: string[] = [];

    // Paginated fetching with strict rate limiting
    while (hasMore) {
      const { subscribers, total } = await getAllSubscribers(page, PAGE_SIZE);
      const emails = subscribers.map(s => s.email).filter(Boolean);
      
      if (emails.length > 0) {
        allEmails = [...allEmails, ...emails];
        totalEmails += emails.length;
        console.log(`Fetched page ${page}: ${emails.length} emails`);
      }

      hasMore = page * PAGE_SIZE < total;
      page++;
      
      // Add delay between page fetches in production
      if (PRODUCTION && hasMore) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (totalEmails === 0) {
      return NextResponse.json(
        { error: "No valid subscribers found" },
        { status: 400 }
      );
    }

    console.log(`Starting batch email sending to ${totalEmails} recipients`);
    console.log(`Production mode: ${PRODUCTION}, Batch size: ${BATCH_SIZE}, Delay: ${BATCH_DELAY}ms`);
    
    // Strict rate limiting in production
    await sendBatchEmails(
      allEmails,
      sendProblemsEmail,
      BATCH_SIZE,
      BATCH_DELAY
    );

    return NextResponse.json(
      { message: `Emails processed for ${totalEmails} recipients` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email sending failed:", error);
    return NextResponse.json(
      { error: "Email processing error" },
      { status: 500 }
    );
  }
}