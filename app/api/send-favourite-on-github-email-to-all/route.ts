import { NextResponse } from "next/server";
import { sendFavouriteOnGithubEmail } from "@/lib/resend";
import { getAllSubscribers } from "@/lib/mongodb";

async function throttleEmails(emails: string[], sendFn: (email: string) => Promise<unknown>, delay = 2000) {
  for (const email of emails) {
    try {
      await sendFn(email);
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      console.error(`Failed to send to ${email}:`, error);
    }
  }
}

export async function GET() {
  try {
    const subscribers = await getAllSubscribers();
    const emails = subscribers.map(s => s.email).filter(Boolean);
    
    if (!emails.length) {
      return NextResponse.json(
        { error: "No valid subscribers found" },
        { status: 400 }
      );
    }

    await throttleEmails(emails, sendFavouriteOnGithubEmail, 1500);

    return NextResponse.json(
      { message: `Emails queued for ${emails.length} recipients` },
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