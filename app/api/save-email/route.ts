import { NextResponse } from "next/server.js";
import { connectToDatabase } from "../../../lib/mongodb.ts";
import { z } from "zod";
import { 
  sendConfirmationEmail, 
  sendAdminNotification, 
  generateConfirmationToken 
} from "../../../lib/email.ts";
import { emailQueue } from "../../../lib/queue.mts"; // Update import

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

    const insertResult = await db.collection("users").insertOne({
      email: normalizedEmail,
      seniorityLevel,
      stacks: [],
      createdAt: new Date(),
      confirmed: false,
      confirmationToken,
      confirmationExpires
    });
    
    try {
      await sendConfirmationEmail(normalizedEmail, confirmationToken);
      
      // Schedule support email with Bull - 2 minutes delay
      const response = await emailQueue.add(
        'support-email', 
        { to: normalizedEmail },
        { delay: 120000 }  // 2 minutes in milliseconds
      );

      console.log('QUEUE RESPONSE:', response);
      
    } catch (error) {
      await db.collection("users").deleteOne({ _id: insertResult.insertedId });
      console.error("Error sending confirmation email:", error);
      throw new Error("Failed to send confirmation email");
    }

    await sendAdminNotification(normalizedEmail).catch(console.error);

    return NextResponse.json({ 
      message: "E-mail salvo e confirmação enviada. E-mail de suporte agendado para 2 minutos." 
    }, { status: 201 });
    
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