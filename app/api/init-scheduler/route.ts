import { NextResponse } from "next/server";
import { scheduleDailyEmails } from "../support-emai/route";

export async function GET() {
  try {
    // Trigger the scheduler setup
    const response = await scheduleDailyEmails();
    return NextResponse.json(
      { message: "Scheduler initialized" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Scheduler initialization failed" },
      { status: 500 }
    );
  }
}