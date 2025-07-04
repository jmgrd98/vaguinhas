import { NextResponse } from "next/server";
import sendBatchEmails from "@/lib/sendBatchEmails";
import { sendNewUpdateEmail } from "@/lib/email";
import { getSubscribersWithoutStacks } from "@/lib/mongodb"; // Import the new function

export async function GET() {
  try {
    let totalEmails = 0;
    let page = 1;
    const pageSize = 500;
    let hasMore = true;
    const allEmails: string[] = [];

    while (hasMore) {
      // Use the specialized function
      const { subscribers, total } = await getSubscribersWithoutStacks(page, pageSize);
      const emails = subscribers.map(s => s.email).filter(Boolean);

      if (emails.length) {
        allEmails.push(...emails);
        totalEmails += emails.length;
      }

      hasMore = page * pageSize < total;
      page++;
    }

    if (totalEmails === 0) {
      return NextResponse.json(
        { error: "No valid subscribers found" },
        { status: 400 }
      );
    }

    console.log(`Starting batch email sending to ${totalEmails} recipients`);
    await sendBatchEmails(allEmails, sendNewUpdateEmail, 10, 1500);

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