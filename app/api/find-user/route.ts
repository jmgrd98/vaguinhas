import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { z } from "zod";

// Email validation schema
const emailSchema = z.string().email().transform(email => email.toLowerCase());

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const { email } = body;
    
    // Validate email format
    const validatedEmail = emailSchema.safeParse(email);
    if (!validatedEmail.success) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();
    
    // Find user by email
    const user = await db.collection("users").findOne({ 
      email: validatedEmail.data 
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has confirmed their email
    if (!user.confirmed) {
      return NextResponse.json(
        { message: "This email has not been confirmed." },
        { status: 403 } // 403 Forbidden - account exists but not activated
      );
    }

    // Return user ID (convert ObjectId to string)
    return NextResponse.json(
      { userId: user._id.toString() },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error finding user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}