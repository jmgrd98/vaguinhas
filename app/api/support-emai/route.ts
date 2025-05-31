// schedule-email/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import cron from "node-cron";
import { sendDailyEmail } from "@/lib/email";

let isSchedulerRunning = false;

// ◀️ Extracted into a named export
export async function scheduleDailyEmails() {
  const { db } = await connectToDatabase();

  if (isSchedulerRunning) {
    return { alreadyRunning: true };
  }

  cron.schedule("0 9 * * *", async () => {
    console.log("Running daily email scheduler…");
    try {
      const users = await db
        .collection("users")
        .find({ confirmed: true, unsubscribed: { $ne: true } })
        .toArray();

      for (const user of users) {
        /**
         * 🚨 NOTE: we’ll talk below about the correct signature for sendDailyEmail;
         * here is just where you’d call it once you have jobs and a token.
         */
        await sendDailyEmail(
          user.email,
          /* jobs array goes here */,
          /* unsubscribeToken goes here */
        );
        console.log(`Sent daily email to ${user.email}`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (err) {
      console.error("Error in daily email scheduler:", err);
    }
  });

  isSchedulerRunning = true;
  return { alreadyRunning: false };
}

// ◀️ Now your POST can just call the helper
export async function POST(request: Request) {
  try {
    const result = await scheduleDailyEmails();
    if (result.alreadyRunning) {
      return NextResponse.json(
        { message: "Scheduler is already running" },
        { status: 200 }
      );
    }
    return NextResponse.json(
      { message: "Daily email scheduler started successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error starting scheduler:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
