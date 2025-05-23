import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { sendConfirmationEmail, generateConfirmationToken } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    const { db } = await connectToDatabase();
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    if (user.confirmed) {
      return NextResponse.json(
        { message: "Esse e-mail já está confirmado" },
        { status: 409 }
      );
    }

    const confirmationToken = generateConfirmationToken();
    const confirmationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          confirmationToken,
          confirmationExpires
        }
      }
    );

    await sendConfirmationEmail(email, confirmationToken);

    return NextResponse.json(
      { message: "E-mail de confirmação reenviado" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Erro ao reenviar confirmação" },
      { status: 500 }
    );
  }
}