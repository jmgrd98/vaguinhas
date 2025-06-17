import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import crypto from "crypto";

// Initialize rate limiter
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
});

// Zod schemas
const unsubscribePostSchema = z.object({
  email: z.string().email().transform(email => email.toLowerCase()),
});

const unsubscribeGetSchema = z.object({
  token: z.string().min(1, "Token is required"),
  email: z.string().email().optional(),
});

// Simplified CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(request: NextRequest) {
  try {
    // Handle OPTIONS
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { headers: corsHeaders });
    }

    // Rate limiting
    const ip = request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";
    const { success } = await ratelimit.limit(`unsub_${ip}`);
    
    if (!success) {
      return NextResponse.redirect(
        new URL("/unsubscribe-error?reason=rate_limit", request.nextUrl.origin),
        { headers: corsHeaders }
      );
    }

    // Extract token and email
    const { searchParams } = request.nextUrl;
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    // Validate input
    const validation = unsubscribeGetSchema.safeParse({ token, email });
    if (!validation.success) {
      return NextResponse.redirect(
        new URL(`/unsubscribe-error?reason=invalid_token&token=${token}`, request.nextUrl.origin),
        { headers: corsHeaders }
      );
    }

    // Database operations
    const { db } = await connectToDatabase();
    
    let user;
    
    // Check if token is an email (contains '@') or base64 encoded email
    if (token && token.includes("@")) {
      // Token is actually an email
      user = await db.collection("users").findOne({ email: token });
    } else if (token) {
      try {
        // Try to decode base64 token
        const decodedEmail = Buffer.from(token, 'base64').toString('utf-8');
        user = await db.collection("users").findOne({ email: decodedEmail });
      } catch (decodeError) {
        console.log("Token is not base64, trying as hex token", decodeError);
        // Try to find by token if it's a hex string
        user = await db.collection("users").findOne({ unsubscribeToken: token });
      }
    } else if (email) {
      // Find by email directly
      user = await db.collection("users").findOne({ email });
    }

    if (!user) {
      return NextResponse.redirect(
        new URL("/unsubscribe-error?reason=user_not_found", request.nextUrl.origin),
        { headers: corsHeaders }
      );
    }

    // Update user status
    const updateData = { 
      $set: { 
        unsubscribed: true, 
        unsubscribedAt: new Date(),
      },
      $unset: {
        unsubscribeToken: ""
      }
    };

    await db.collection("users").updateOne({ _id: user._id }, updateData);

    // Redirect to success page
    return NextResponse.redirect(
      new URL(
        `/unsubscribe-success?email=${encodeURIComponent(user.email)}`, 
        request.nextUrl.origin
      ),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Unsubscribe GET error:", error);
    return NextResponse.redirect(
      new URL("/unsubscribe-error", request.nextUrl.origin),
      { headers: corsHeaders }
    );
  }
}

// ... rest of the code remains the same ...

export async function POST(request: NextRequest) {
  try {
    // Handle OPTIONS
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { headers: corsHeaders });
    }

    // Rate limiting
    const ip = request.headers.get("cf-connecting-ip") ||
           request.headers.get("x-forwarded-for") ||
           request.headers.get("x-real-ip") ||
           "127.0.0.1";
    const { success } = await ratelimit.limit(`unsub_${ip}`);
    
    if (!success) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429, headers: corsHeaders }
      );
    }

    // Validate request body
    const body = await request.json();
    const validation = unsubscribePostSchema.safeParse(body);

    console.log('BODY', body);
    
    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid email address" },
        { status: 400, headers: corsHeaders }
      );
    }
    
    const { email } = validation.data;

    // Generate unsubscribe token
    const unsubscribeToken = crypto.randomBytes(32).toString("hex");

    console.log('UNSUBSCRIBE TOKEN', unsubscribeToken);

    // Database operations
    const { db } = await connectToDatabase();
    
    const result = await db.collection("users").updateOne(
      { email },
      { 
        $set: { 
          unsubscribeToken,
          unsubscribed: false // Reset status until they actually unsubscribe
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { 
        message: "Unsubscribe token generated",
        unsubscribeToken 
      },
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
  return new NextResponse(null, { headers: corsHeaders });
}