import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { z } from "zod";
import { sendConfirmationEmail, sendAdminNotification, generateConfirmationToken } from '@/lib/email';

const emailSchema = z.string().email().transform(email => email.toLowerCase());

const requestSchema = z.object({
  email: emailSchema,
  seniorityLevel: z.array(z.string())
});

export async function POST(request: Request) {
  try {
    const requestData = await request.json();

    const validation = requestSchema.safeParse(requestData);
    if (!validation.success) {
      return NextResponse.json(
        { message: "E-mail inválido", errors: validation.error.errors },
        { status: 400 }
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

    await db.collection("users").insertOne({
      email: normalizedEmail,
      seniorityLevel,
      stacks: [],
      createdAt: new Date(),
      confirmed: false,
      confirmationToken,
      confirmationExpires
    });

    await sendConfirmationEmail(normalizedEmail, confirmationToken);
    await sendAdminNotification(normalizedEmail);

    return NextResponse.json({ message: "E-mail salvo e confirmação enviada" }, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao processar solicitação";

    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: "Method not allowed" },
    { status: 405 }
  );
}