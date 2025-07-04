import { NextResponse } from "next/server";
import sendBatchEmails from "@/lib/sendBatchEmails";
import { sendNewUpdateEmail } from "@/lib/email"; // Import the specific email function
import { getAllSubscribers } from "@/lib/mongodb";

export async function GET() {
  try {
    let totalEmails = 0;
    let page = 1;
    const pageSize = 500;
    let hasMore = true;
    let allEmails: string[] = [];

    // Paginated fetching
    while (hasMore) {
      const { subscribers, total } = await getAllSubscribers(page, pageSize);
      const emails = subscribers.map(s => s.email).filter(Boolean);
      
      if (emails.length > 0) {
        allEmails = [...allEmails, ...emails];
        totalEmails += emails.length;
      }

      // Check if there are more pages
      hasMore = page * pageSize < total;
      page++;
    }

    if (totalEmails === 0) {
      return NextResponse.json(
        { error: "No valid subscribers found" },
        { status: 400 }
      );
    }

    // Send emails in batches
    console.log(`Starting batch email sending to ${totalEmails} recipients`);
    await sendBatchEmails(
      allEmails,
      sendNewUpdateEmail, // Use your specific email function
      10, // Batch size
      1500 // Delay between batches (1.5s)
    );

    return NextResponse.json(
      { message: `${totalEmails} emails processed successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email processing failed:", error);
    return NextResponse.json(
      { error: "Email processing error" },
      { status: 500 }
    );
  }
}