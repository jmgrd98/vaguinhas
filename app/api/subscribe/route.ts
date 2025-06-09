import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { z } from "zod";
import { verifyJwt } from "@/lib/auth";
import {
  sendConfirmationEmail,
  sendAdminNotification,
  generateConfirmationToken,
} from "@/lib/email";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";


const emailSchema = z.string().email().transform((email) => email.toLowerCase());
const requestSchema = z.object({
  email: emailSchema,
  seniorityLevel: z.array(z.string().max(50)).max(5),
});

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
});

const API_SECRET = process.env.JWT_SECRET;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const headers = {
      'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' 
        ? '*' 
        : 'https://vaguinhas.com.br',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    // Handle OPTIONS requests
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { headers });
    }

    const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success } = await ratelimit.limit(ip);
    
    if (!success) {
      return NextResponse.json(
        { message: "Muitas solicitações. Tente novamente mais tarde." },
        { status: 429, headers }
      );
    }

    // 1. Verify Authorization Header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${API_SECRET}`) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401, headers }
      );
    }

    const body = await req.json();
    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: "Request inválido", errors: validation.error.errors },
        { status: 400, headers }
      );
    }
    const { email: normalizedEmail, seniorityLevel } = validation.data;

    const { db } = await connectToDatabase();
    const existing = await db.collection("users").findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json(
        { message: "Este e-mail já está cadastrado" },
        { status: 409 }
      );
    }

    const confirmationToken = generateConfirmationToken();
    const confirmationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const insertResult = await db.collection("users").insertOne({
      email: normalizedEmail,
      seniorityLevel,
      stacks: [] as string[],
      createdAt: new Date(),
      confirmed: false,
      confirmationToken,
      confirmationExpires,
    });

    try {
      await sendConfirmationEmail(normalizedEmail, confirmationToken);
    } catch (error) {
      await db.collection("users").deleteOne({ _id: insertResult.insertedId });
      console.error("Error sending confirmation email:", error);
      return NextResponse.json(
        { message: "Falha ao enviar e-mail de confirmação" },
        { status: 500 }
      );
    }
    await sendAdminNotification(normalizedEmail).catch(console.error);

    return NextResponse.json(
      {
        message: "E-mail salvo e confirmação enviada. E-mail de suporte agendado para 2 minutos.",
      },
      { status: 201, headers }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao processar solicitação";
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    verifyJwt(req);
    return NextResponse.json(
      { message: "Method not allowed" },
      { status: 405 }
    );
  } catch {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }
}
