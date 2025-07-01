// app/api/send-confirm-email/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { sendConfirmationEmail } from '@/lib/email';
import generateConfirmationToken from '@/lib/generateConfirmationToken';
import { generatePassword } from '@/lib/generatePassword';
import bcrypt from 'bcryptjs';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { z } from 'zod';

// Rate limiter: 3 requests per minute per IP
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, '60 s'),
  analytics: true,
});

// Zod schema for body validation
const bodySchema = z.object({
  email: z.string().email().transform((e) => e.toLowerCase()),
});

const SALT_ROUNDS = 12;

export async function POST(request: NextRequest) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin':
      process.env.NODE_ENV === 'development' ? '*' : 'https://www.vaguinhas.com.br',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { headers });
    }

    // Rate limit by IP
    const ip =
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { message: 'Muitas solicitações. Tente novamente mais tarde.' },
        { status: 429, headers }
      );
    }

    // Validate
    const data = await request.json();
    const parse = bodySchema.safeParse(data);
    if (!parse.success) {
      return NextResponse.json(
        { message: 'E-mail inválido.' },
        { status: 400, headers }
      );
    }
    const { email } = parse.data;

    // Connect and find user
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: 'Usuário não encontrado.' },
        { status: 404, headers }
      );
    }
    if (user.confirmed) {
      return NextResponse.json(
        { message: 'E-mail já confirmado.' },
        { status: 409, headers }
      );
    }

    // Generate token + expiry + random password
    const confirmationToken = generateConfirmationToken();
    const confirmationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    const newPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update user document
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          confirmationToken,
          confirmationExpires,
          password: hashedPassword,
          lastResendAttempt: new Date(),
        },
        $inc: { reminderCount: 1 },
      }
    );

    // Send email with link and password
    await sendConfirmationEmail(email, confirmationToken, newPassword);

    return NextResponse.json(
      { message: `E-mail de confirmação reenviado para ${email}` },
      { status: 200, headers }
    );
  } catch (err) {
    console.error('Erro em send-confirm-email route:', err);
    return NextResponse.json(
      { message: 'Erro interno ao tentar reenviar e‑mail.' },
      { status: 500, headers }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin':
        process.env.NODE_ENV === 'development' ? '*' : 'https://www.vaguinhas.com.br',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}