import { NextResponse } from "next/server";
import { sendFavouriteOnGithubEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    // Get the email from the request body
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Send email only to this specific email
    await sendFavouriteOnGithubEmail(email);

    return NextResponse.json(
      { message: "Support email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to send support email:", error);
    return NextResponse.json(
      { error: "Failed to send support email" },
      { status: 500 }
    );
  }
}