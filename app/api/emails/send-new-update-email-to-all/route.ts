import { NextResponse } from "next/server";
import { emailQueue } from "@/lib/emailQueue";
import { getAllSubscribers } from "@/lib/mongodb";

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

    // Add emails to queue
    await emailQueue.addBulk(
      emails.map(email => ({
        name: "new-update-email",
        data: { email },
        opts: { 
          removeOnComplete: true,
          removeOnFail: 100 
        }
      }))
    );

    return NextResponse.json(
      { message: `${emails.length} emails queued for sending` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Queueing failed:", error);
    return NextResponse.json(
      { error: "Email queueing error" },
      { status: 500 }
    );
  }
}