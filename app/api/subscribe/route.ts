import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { 
  sendAdminNotification,
  // sendConfirmationEmail 
} from "@/lib/resend";
import { sendConfirmationEmail } from "@/lib/email";
import bcrypt from "bcryptjs"; // Import bcrypt for password hashing
import { generatePassword } from "@/lib/generatePassword";
import generateConfirmationToken from "@/lib/generateConfirmationToken";

const SALT_ROUNDS = 12; // Define salt rounds for bcrypt

const emailSchema = z.string().email().transform(email => email.toLowerCase());
const requestSchema = z.object({
  email: emailSchema,
  seniorityLevel: z.string().min(1).max(50),
  stacks: z.array(z.string().min(1).max(50)).min(1).optional(),
});

// Initialize rate limiter
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  // CORS headers configuration
  const headers = {
    'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' 
      ? '*' 
      : 'https://www.vaguinhas.com.br',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    // Handle OPTIONS requests
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { headers });
    }

    // Rate limiting
    const ip = req.headers.get("cf-connecting-ip") || 
               req.headers.get("x-forwarded-for") || 
               req.headers.get("x-real-ip") || 
               "127.0.0.1";
    
    const { success } = await ratelimit.limit(ip);
    
    if (!success) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429, headers }
      );
    }

    // Validate request body
    const body = await req.json();
    const validation = requestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          message: "Invalid request", 
          errors: validation.error.errors 
        },
        { status: 400, headers }
      );
    }
    
    const { email: normalizedEmail, seniorityLevel, stacks } = validation.data;
    const stack = stacks && stacks[0];

    // Generate password
    const plainPassword = generatePassword();
    
    // Hash password before storage
    const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);

    // Database operations
    const { db } = await connectToDatabase();
    const existing = await db.collection("users").findOne({ email: normalizedEmail });
    
    if (existing) {
      return NextResponse.json(
        { message: "This email is already registered" },
        { status: 409, headers }
      );
    }

    // Generate confirmation token
    const confirmationToken = generateConfirmationToken();
    const confirmationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Insert new user with hashed password
    const insertResult = await db.collection("users").insertOne({
      email: normalizedEmail,
      seniorityLevel,
      stacks: [stack],
      createdAt: new Date(),
      confirmed: false,
      confirmationToken,
      confirmationExpires,
      password: hashedPassword, // Store hashed password
    });

    try {
      // Send confirmation email with plain text password
      await sendConfirmationEmail(normalizedEmail, confirmationToken, plainPassword);
    } catch (error) {
      // Rollback on email failure
      await db.collection("users").deleteOne({ _id: insertResult.insertedId });
      console.error("Email sending error:", error);
      
      return NextResponse.json(
        { message: "Failed to send confirmation email" },
        { status: 500, headers }
      );
    }

    // Send admin notification (fire-and-forget)
    sendAdminNotification(normalizedEmail).catch(error => 
      console.error("Admin notification failed:", error)
    );

    return NextResponse.json(
      { message: "Email saved, password generated, and confirmation sent!" },
      { status: 201, headers }
    );
  } catch (error) {
    console.error("Server error:", error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Internal server error";
    
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: "Method not allowed" },
    { status: 405 }
  );
}