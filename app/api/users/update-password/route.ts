import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { LRUCache } from "lru-cache";

// Initialize rate limiters
const ipRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "60 s"),
  analytics: true,
});

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

// CORS headers configuration
const getCorsHeaders = () => ({
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' 
    ? '*' 
    : 'https://www.vaguinhas.com.br',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
});

const requestSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const headers = getCorsHeaders();

  try {
    // Handle OPTIONS requests first
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { headers });
    }

    // JWT Authentication (if provided)
    const authToken = req.headers.get('authorization')?.split(' ')[1];
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
      const ip = req.headers.get("cf-connecting-ip") || 
                 req.headers.get("x-forwarded-for") || 
                 req.headers.get("x-real-ip") || 
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
    const body = await req.json();
    const validation = requestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          message: "Requisição inválida", 
          errors: validation.error.errors 
        },
        { status: 400, headers }
      );
    }
    
    const { token, newPassword } = validation.data;
    const { db } = await connectToDatabase();
    
    // Find user by reset token
    const user = await db.collection("users").findOne({ 
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() } // Token not expired
    });
    
    if (!user) {
      return NextResponse.json(
        { message: "Token inválido ou expirado" },
        { status: 400, headers }
      );
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update user password and clear reset token
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: { resetToken: "", resetTokenExpiry: "" }
      }
    );
    
    // Return success response
    return NextResponse.json(
      { 
        message: "Senha atualizada com sucesso!",
        userId: user._id.toString(),
        systemRequest: isSystemRequest
      },
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Password update error:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
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