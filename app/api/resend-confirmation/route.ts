import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { generateConfirmationToken, sendConfirmationEmail,  } from '@/lib/resend';
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { z } from "zod";

// Initialize rate limiter
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "60 s"), // 3 requests per minute
  analytics: true,
});

// Zod schema for validation
const resendSchema = z.object({
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
        { message: "Muitas solicitações. Tente novamente mais tarde." },
        { status: 429, headers }
      );
    }

    // Validate request body
    const body = await request.json();
    const validation = resendSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { message: "E-mail inválido" },
        { status: 400, headers }
      );
    }
    
    const { email } = validation.data;

    // Database operations
    const { db } = await connectToDatabase();
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404, headers }
      );
    }

    if (user.confirmed) {
      return NextResponse.json(
        { message: "Esse e-mail já está confirmado" },
        { status: 409, headers }
      );
    }

    // Generate new token and update user
    const confirmationToken = generateConfirmationToken();
    const confirmationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const updateResult = await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          confirmationToken,
          confirmationExpires,
          lastResendAttempt: new Date()  // Track resend attempts
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      throw new Error("Failed to update user token");
    }

    // Send confirmation email
    await sendConfirmationEmail(email, confirmationToken);

    return NextResponse.json(
      { message: "E-mail de confirmação reenviado" },
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Erro ao reenviar confirmação:", error);
    return NextResponse.json(
      { message: "Erro ao reenviar confirmação" },
      { status: 500, headers }
    );
  }
}

// OPTIONS handler for CORS preflight
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