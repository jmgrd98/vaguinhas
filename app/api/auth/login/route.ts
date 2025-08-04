import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createSessionToken } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = loginSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input" },
        { status: 400 }
      );
    }
    
    const { email, password } = validation.data;
    const { db } = await connectToDatabase();
    
    const user = await db.collection("users").findOne({ 
      email: email.toLowerCase() 
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    if (!user.confirmed) {
      return NextResponse.json(
        { message: "Email not confirmed" },
        { status: 403 }
      );
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create session token
    const sessionToken = createSessionToken(user._id.toString());

    return NextResponse.json(
      { 
        userId: user._id.toString(),
        token: sessionToken,
        email: user.email
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}