import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
// import { sendConfirmationEmail } from '@/lib/resend';
import { sendConfirmationEmail } from '@/lib/email';
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { generatePassword } from "@/lib/generatePassword";
import generateConfirmationToken from '@/lib/generateConfirmationToken';

// Initialize rate limiter
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "60 s"),
  analytics: true,
});

// Zod schema for validation
const resendSchema = z.object({
  email: z.string().email().transform(email => email.toLowerCase()),
});

const SALT_ROUNDS = 12;

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

    // Generate new token
    const confirmationToken = generateConfirmationToken();
    const confirmationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update user with new token AND password
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword, // Update password
          confirmationToken,
          confirmationExpires,
          lastResendAttempt: new Date()
        }
      }
    );

    // Send confirmation email with password
    await sendConfirmationEmail(email, confirmationToken, newPassword);

    return NextResponse.json(
      { message: "E-mail de confirmação reenviado com sua senha" },
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