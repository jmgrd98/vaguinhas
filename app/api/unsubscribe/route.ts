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

// Zod schemas for validation
const unsubscribePostSchema = z.object({
  email: z.string().email().transform(email => email.toLowerCase()),
});

const unsubscribeGetSchema = z.object({
  token: z.string().min(32, "Invalid token"),
});

// CORS headers configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' 
    ? '*' 
    : 'https://www.vaguinhas.com.br',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export async function GET(request: NextRequest) {
  
  try {
    // Rate limiting
    const ip = request.headers.get("cf-connecting-ip") || 
               request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "127.0.0.1";
    
    const { success } = await ratelimit.limit(ip);
    console.log('SUCCESS', success);
    if (!success) {
      return NextResponse.redirect(
        new URL('/unsubscribe-error?reason=rate_limit', request.url),
        { headers: corsHeaders }
      );
    }

    // Validate token from query string
    const token = request.nextUrl.searchParams.get("token");
    const validation = unsubscribeGetSchema.safeParse({ token });
    
    if (!validation.success) {
      return NextResponse.redirect(
        new URL('/unsubscribe-error?reason=invalid_token', request.url),
        { headers: corsHeaders }
      );
    }
    
    // Database operations
    const { db } = await connectToDatabase();
    
    // Find user by unsubscribeToken
    const user = await db.collection("users").findOne({
      unsubscribeToken: validation.data.token
    });

    if (!user) {
      return NextResponse.redirect(
        new URL('/unsubscribe-error?reason=user_not_found', request.url),
        { headers: corsHeaders }
      );
    }

    // Update user status
    await db.collection("users").updateOne(
      { _id: user._id },
      { 
        $set: { 
          unsubscribed: true, 
          unsubscribedAt: new Date() 
        },
        $unset: {
          unsubscribeToken: "" // Remove token after use
        }
      }
    );

    // Redirect to success page
    return NextResponse.redirect(
      new URL('/unsubscribe-success', request.url),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Unsubscribe GET error:", error);
    return NextResponse.redirect(
      new URL('/unsubscribe-error', request.url),
      { headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Handle OPTIONS requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { headers: corsHeaders });
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
        { status: 429, headers: corsHeaders }
      );
    }

    // Validate request body
    const body = await request.json();
    const validation = unsubscribePostSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid email address" },
        { status: 400, headers: corsHeaders }
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
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { message: "Successfully unsubscribed" },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Unsubscribe POST error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: corsHeaders
  });
}