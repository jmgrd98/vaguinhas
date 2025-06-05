import { NextResponse } from "next/server";
import cron from "node-cron";
// import { scheduleDailyEmails } from "../schedule-email/route";

// Initialize email schedulers
export function initSchedulers() {
  // Schedule main job emails (existing)
//   scheduleDailyEmails();

  // Schedule support email daily at 11:00 AM
  cron.schedule("0 11 * * *", async () => {
    const endpoint = `${process.env.NEXT_PUBLIC_SITE_URL}/api/send-support-email`;
    await fetch(endpoint);
  });
}

export async function GET() {
  try {
    initSchedulers();
    return NextResponse.json(
      { message: "All schedulers initialized" },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error initializing schedulers:', error);
    return NextResponse.json(
      { message: "Scheduler initialization failed" },
      { status: 500 }
    );
  }
}