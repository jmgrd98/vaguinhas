// Alternative streaming approach
import { NextResponse } from "next/server";
import sendBatchEmails from "@/lib/sendBatchEmails";
import { sendProblemsEmail } from "@/lib/email";
import { connectToDatabase } from "@/lib/mongodb";

const DB_PAGE_SIZE = 500;
const EMAIL_BATCH_SIZE = 10;
const BATCH_DELAY = 1500;

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const cursor = db.collection("users").find({});
    let totalEmails = 0;
    let emailBatch: string[] = [];
    
    while (await cursor.hasNext()) {
      const user = await cursor.next();
      if (user?.email) {
        emailBatch.push(user.email);
        totalEmails++;
      }
      
      // Process batch when full
      if (emailBatch.length >= DB_PAGE_SIZE) {
        await sendBatchEmails(
          emailBatch,
          sendProblemsEmail,
          EMAIL_BATCH_SIZE,
          BATCH_DELAY
        );
        emailBatch = [];
      }
    }
    
    // Process remaining emails
    if (emailBatch.length > 0) {
      await sendBatchEmails(
        emailBatch,
        sendProblemsEmail,
        EMAIL_BATCH_SIZE,
        BATCH_DELAY
      );
    }
    
    if (totalEmails === 0) {
      return NextResponse.json(
        { error: "No valid subscribers found" },
        { status: 400 }
      );
    }

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