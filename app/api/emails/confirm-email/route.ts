import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { LRUCache } from "lru-cache";

// Initialize IP-based rate limiter (Upstash Redis)
const ipRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "60 s"), // 10 requests per minute
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

// CORS headers configuration
const getCorsHeaders = () => ({
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' 
    ? '*' 
    : 'https://www.vaguinhas.com.br',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
});

export async function GET(request: NextRequest) {
  const headers = getCorsHeaders();

  try {
    // Handle OPTIONS requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { headers });
    }

    // IP-based rate limiting
    const ip = request.headers.get("cf-connecting-ip") || 
               request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "127.0.0.1";
    
    const ipRateLimitResult = await ipRatelimit.limit(ip);
    
    if (!ipRateLimitResult.success) {
      return NextResponse.json(
        { message: "Muitas solicitações. Tente novamente mais tarde." },
        { status: 429, headers }
      );
    }

    // JWT Authentication
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (token) {
      // Token-based rate limiting (for automated systems)
      if (!token || token !== process.env.JWT_SECRET) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401, headers }
        );
      }

      if (isTokenRateLimited(token)) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Try again in 30 minutes." },
          { status: 429, headers }
        );
      }
    }

    // Validate confirmation token
    const { searchParams } = new URL(request.url);
    const confirmationToken = searchParams.get('token');

    if (!confirmationToken || confirmationToken.length !== 64) {
      return NextResponse.json(
        { message: "Token inválido" },
        { status: 400, headers }
      );
    }

    // Database operations
    const { db } = await connectToDatabase();
    const user = await db.collection("users").findOne({
      confirmationToken: confirmationToken,
      confirmationExpires: { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json(
        { message: "Token inválido ou expirado" },
        { status: 400, headers }
      );
    }

    if (user.confirmed) {
      return NextResponse.json(
        { message: "Esse e-mail já está confirmado." },
        { status: 409, headers }
      );
    }

    // Update user
    const updateResult = await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: { 
          confirmed: true,
          confirmedAt: new Date()
        },
        $unset: { 
          confirmationToken: "", 
          confirmationExpires: "" 
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      throw new Error("Failed to update user confirmation status");
    }

    return NextResponse.json(
      { message: "E-mail confirmado com sucesso!" },
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Erro na confirmação de e-mail:", error);
    return NextResponse.json(
      { message: "Erro ao confirmar e-mail" },
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