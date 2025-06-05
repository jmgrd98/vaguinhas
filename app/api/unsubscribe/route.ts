import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(request: Request) {
  const { email } = await request.json();
  
  if (!email) {
    return NextResponse.json(
      { message: "Email is required" },
      { status: 400 }
    );
  }

  try {
    const { db } = await connectToDatabase();
    
    const result = await db.collection("users").updateOne(
      { email },
      { $set: { unsubscribed: true } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { message: "User not found or already unsubscribed" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Successfully unsubscribed" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}