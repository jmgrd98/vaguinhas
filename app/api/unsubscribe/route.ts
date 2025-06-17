import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import crypto from 'crypto';

// Initialize rate limiter
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
});

// Zod schema for email only
const emailSchema = z.string().email().transform(e => e.toLowerCase());

// Simplified CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(request: NextRequest) {
  try {
    // OPTIONS preflight
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

    // Extract and decode token
    const token = request.nextUrl.searchParams.get("email") || '';
    let email = '';

    try {
      // URL-decode then base64-decode
      const decodedToken = decodeURIComponent(token);
      email = Buffer.from(decodedToken, 'base64').toString('utf-8');
    } catch (error) {
      console.error('Token decoding error:', error);
      return NextResponse.redirect(
        new URL(`/unsubscribe-error?reason=invalid_token`, request.nextUrl.origin),
        { headers: corsHeaders }
      );
    }

    // Validate email
    const parse = emailSchema.safeParse(email);
    if (!parse.success) {
      return NextResponse.redirect(
        new URL(`/unsubscribe-error?reason=invalid_email`, request.nextUrl.origin),
        { headers: corsHeaders }
      );
    }
    email = parse.data;

    // DB operations
    const { db } = await connectToDatabase();
    const user = await db.collection("users").findOne({ email });
    if (!user) {
      return NextResponse.redirect(
        new URL(`/unsubscribe-error?reason=user_not_found`, request.nextUrl.origin),
        { headers: corsHeaders }
      );
    }

    // Delete user
    await db.collection("users").deleteOne({ email: user.email });

    // Redirect to success
    return NextResponse.redirect(
      new URL(`/unsubscribe-success?email=${encodeURIComponent(email)}`, request.nextUrl.origin),
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

export async function POST(request: NextRequest) {
  try {
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { headers: corsHeaders });
    }
    const ip = request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";
    const { success } = await ratelimit.limit(`unsub_${ip}`);
    if (!success) {
      return NextResponse.json({ message: "Too many requests" }, { status: 429, headers: corsHeaders });
    }

    const body = await request.json();
    const parse = emailSchema.safeParse(body.email);
    if (!parse.success) {
      return NextResponse.json({ message: "Invalid email address" }, { status: 400, headers: corsHeaders });
    }
    const email = parse.data;

    // generate and save token if needed (optional)
    const unsubscribeToken = crypto.randomBytes(32).toString("hex");
    const { db } = await connectToDatabase();
    const result = await db.collection("users").updateOne(
      { email },
      { $set: { unsubscribeToken, unsubscribed: false } }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json({ message: "Token generated", unsubscribeToken }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Unsubscribe POST error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}