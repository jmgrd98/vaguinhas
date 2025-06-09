import { NextResponse, NextRequest } from "next/server";
import { sendFavouriteOnGithubEmail } from "@/lib/email";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { z } from "zod";

// Initialize rate limiter
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(2, "86400 s"), // 2 requests per day
  analytics: true,
});

// Zod schema for validation
const requestSchema = z.object({
  email: z.string().email().transform(email => email.toLowerCase()),
});

export async function POST(request: NextRequest) {
  // CORS headers configuration
  const headers = {
    'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' 
      ? '*' 
      : 'https://vaguinhas.com.br',
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
        { error: "Limite de solicitações excedido. Tente novamente amanhã." },
        { status: 429, headers }
      );
    }

    // Validate request body
    const body = await request.json();
    const validation = requestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "E-mail inválido" },
        { status: 400, headers }
      );
    }
    
    const { email } = validation.data;

    // Send email
    await sendFavouriteOnGithubEmail(email);

    return NextResponse.json(
      { message: "E-mail de suporte enviado com sucesso" },
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Failed to send support email:", error);
    return NextResponse.json(
      { error: "Falha ao enviar e-mail de suporte" },
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
        : 'https://vaguinhas.com.br',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}