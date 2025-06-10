// app/api/support/send-all/route.ts
import { NextResponse, NextRequest } from "next/server";
import { sendSupportUsEmail } from "@/lib/email";
import { getAllSubscribers } from "@/lib/mongodb";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize rate limiter: 2 requests per day per IP
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(2, "86400 s"),
  analytics: true,
});

// Shared CORS headers config
const CORS_HEADERS = {
  "Access-Control-Allow-Origin":
    process.env.NODE_ENV === "development" ? "*" : "https://vaguinhas.com.br",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  // Preflight
  return new NextResponse(null, { headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by client IP
    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Limite de solicitações excedido. Tente novamente amanhã." },
        { status: 429, headers: CORS_HEADERS }
      );
    }

    // Fetch all subscriber emails
    const subscribers = await getAllSubscribers();
    const emails = subscribers.map((sub) => sub.email.toLowerCase());

    if (!emails.length) {
      return NextResponse.json(
        { error: "Nenhum assinante encontrado para enviar e-mails." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Send support email to each subscriber in parallel
    await Promise.all(emails.map((email) => sendSupportUsEmail(email)));

    return NextResponse.json(
      {
        message: `E-mail de suporte enviado com sucesso a ${emails.length} assinantes.`,
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("Failed to send support emails to all:", err);
    return NextResponse.json(
      { error: "Falha ao enviar e-mail de suporte a todos os assinantes." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
