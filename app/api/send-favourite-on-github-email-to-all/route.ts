import { NextResponse } from "next/server";
import { sendFavouriteOnGithubEmail } from "@/lib/email";
import { getAllSubscribers } from "@/lib/mongodb";

export async function GET() {
  try {
    const subscribers = await getAllSubscribers();
    const emails = subscribers.map((subscriber) => subscriber.email);
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json(
        { error: "An array of email addresses is required" },
        { status: 400 }
    );
    }

    await Promise.all(
        emails.map((email) => sendFavouriteOnGithubEmail(email))
    );

    return NextResponse.json(
      { message: `Support emails sent to ${emails.length} recipients successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to send support emails:", error);
    return NextResponse.json(
      { error: "Failed to send support emails" },
      { status: 500 }
    );
  }
}
