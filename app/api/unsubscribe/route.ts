import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize rate limiter
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 requests per minute
  analytics: true,
});

// Zod schema for validation
const unsubscribeSchema = z.object({
  email: z.string().email().transform(email => email.toLowerCase()),
});

export async function POST(request: NextRequest) {
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
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { headers });
    }

    // Rate limiting
    const ip = request.headers.get("cf-connecting-ip") || 
               request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "127.0.0.1";
    
    const { success } = await ratelimit.limit(ip);
    
    if (!success) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429, headers }
      );
    }

    // Validate request body
    const body = await request.json();
    const validation = unsubscribeSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid email address" },
        { status: 400, headers }
      );
    }
    
    const { email } = validation.data;

    // Database operations
    const { db } = await connectToDatabase();
    
    const result = await db.collection("users").updateOne(
      { email },
      { $set: { unsubscribed: true, unsubscribedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { message: "User not found or already unsubscribed" },
        { status: 404, headers }
      );
    }

    return NextResponse.json(
      { message: "Successfully unsubscribed" },
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500, headers }
    );
  }
}

// Add OPTIONS handler
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' 
        ? '*' 
        : 'https://www.vaguinhas.com.br',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}