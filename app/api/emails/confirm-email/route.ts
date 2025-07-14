import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { LRUCache } from "lru-cache";

// Define webhook payload type
interface WebhookPayload {
  event: "email_confirmed";
  email: string;
  seniorityLevel: string;
  stack: string;
  timestamp: string;
  confirmedAt: string;
}

// Initialize rate limiter
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: true,
});

// Webhook trigger function with type safety
const triggerMakeWebhook = async (data: WebhookPayload): Promise<void> => {
  const WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
  
  if (!WEBHOOK_URL) {
    console.error("Make webhook URL not configured");
    return;
  }

  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    console.log(`Webhook triggered for ${data.email}`);
  } catch (error) {
    console.error("Make.com webhook failed:", error);
  }
};

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
    
    if (!token || token.length !== 64) {
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

    // Trigger webhook with type-safe payload
    const payload: WebhookPayload = {
      event: "email_confirmed",
      email: user.email,
      seniorityLevel: user.seniorityLevel,
      stack: user.stacks[0], // Using the first stack
      timestamp: new Date().toISOString(),
      confirmedAt: new Date().toISOString()
    };

    // Fire and forget - no need to await
    triggerMakeWebhook(payload);

    return NextResponse.json(
      { message: "E-mail confirmado com sucesso!" },
      { status: 200, headers }
    );
  } catch (error: unknown) {
    console.error("Erro na confirmação de e-mail:", error);
    return NextResponse.json(
      { message: (error as Error).message || "Erro ao confirmar e-mail" },
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