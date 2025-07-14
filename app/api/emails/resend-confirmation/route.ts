import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { sendConfirmationEmail } from '@/lib/email';
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { generatePassword } from "@/lib/generatePassword";
import generateConfirmationToken from '@/lib/generateConfirmationToken';
import { LRUCache } from "lru-cache";

// Initialize Upstash rate limiter
const ipRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "60 s"),
  analytics: true,
});

// Initialize token-based rate limiter (in-memory)
const tokenRateLimitCache = process.env.NODE_ENV === "production" 
  ? new LRUCache<string, number[]>({
      max: 100,
      ttl: 30 * 60 * 1000, // 30 minutes
    })
  : null;

function isTokenRateLimited(token: string, limit = 5) {
  if (!tokenRateLimitCache || process.env.NODE_ENV !== "production") return false;
  
  const tokenCount = tokenRateLimitCache.get(token) || [0];
  if (tokenCount[0] >= limit) return true;
  
  tokenRateLimitCache.set(token, [tokenCount[0] + 1]);
  return false;
}

// Zod schema for validation
const resendSchema = z.object({
  email: z.string().email().transform(email => email.toLowerCase()),
});

const SALT_ROUNDS = 12;

// CORS headers configuration
const getCorsHeaders = () => ({
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' 
    ? '*' 
    : 'https://www.vaguinhas.com.br',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
});

export async function POST(request: NextRequest) {
  const headers = getCorsHeaders();

  try {
    // Handle OPTIONS requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { headers });
    }

    // JWT Authentication (if provided)
    const authToken = request.headers.get('authorization')?.split(' ')[1];
    let isSystemRequest = false;
    
    if (authToken) {
      // Validate JWT
      if (authToken !== process.env.JWT_SECRET) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401, headers }
        );
      }
      
      // Apply token-based rate limiting for system requests
      isSystemRequest = true;
      if (isTokenRateLimited(authToken)) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Try again in 30 minutes." },
          { status: 429, headers }
        );
      }
    } else {
      // Apply IP-based rate limiting for user requests
      const ip = request.headers.get("cf-connecting-ip") || 
                 request.headers.get("x-forwarded-for") || 
                 request.headers.get("x-real-ip") || 
                 "127.0.0.1";
      
      const { success } = await ipRatelimit.limit(ip);
      
      if (!success) {
        return NextResponse.json(
          { message: "Muitas solicitações. Tente novamente mais tarde." },
          { status: 429, headers }
        );
      }
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
      { 
        message: "E-mail de confirmação reenviado com sua senha",
        systemRequest: isSystemRequest
      },
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
    headers: getCorsHeaders()
  });
}