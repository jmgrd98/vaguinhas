import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { Collection, UpdateFilter } from "mongodb";
import type { GotHiredMessage } from "@/types/user";

// Define the User interface to match your MongoDB schema
interface User {
  _id?: string;
  email: string;
  messages: GotHiredMessage[];
  lastHiredAt?: Date;
  // Add other user fields as needed
}

const emailSchema = z.string().email().transform(email => email.toLowerCase());
const requestSchema = z.object({
  email: emailSchema,
  company: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  message: z.string().max(500).optional(),
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
    
    const { email: normalizedEmail, company, role, message } = validation.data;

    // Database operations with proper typing
    const { db } = await connectToDatabase();
    const usersCollection: Collection<User> = db.collection<User>("users");
    
    const user = await usersCollection.findOne({ email: normalizedEmail });
    
    if (!user) {
      return NextResponse.json(
        { message: "E-mail não cadastrado. Por favor, cadastre-se primeiro." },
        { status: 404, headers }
      );
    }

    // Create the hire message object
    const hireMessage: GotHiredMessage = {
      company,
      role,
      message: message || null,
      createdAt: new Date(),
    };

    // Properly typed update operation
    const updateDoc: UpdateFilter<User> = {
      $push: {
        messages: hireMessage
      },
      $set: {
        lastHiredAt: new Date(),
      }
    };

    const updateResult = await usersCollection.updateOne(
      { email: normalizedEmail },
      updateDoc
    );

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { message: "Failed to update user information" },
        { status: 500, headers }
      );
    }

    // Optional: Send notification to admin about new hire
    // You can uncomment and implement this if needed
    // sendHireNotification(normalizedEmail, company, role).catch(error => 
    //   console.error("Hire notification failed:", error)
    // );

    return NextResponse.json(
      { message: "Informações recebidas com sucesso! Parabéns pela conquista!" },
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Server error:", error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Internal server error";
    
    return NextResponse.json(
      { message: errorMessage },
      { status: 500, headers }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: "Method not allowed" },
    { status: 405 }
  );
}