import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { createTransport } from 'nodemailer';
import { randomBytes } from 'crypto';

const transporter = createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

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

    const confirmationToken = randomBytes(32).toString('hex');
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

    const baseUrl = process.env.NEXTAUTH_URL || 
                   `${request.headers.get('x-forwarded-proto')}://${request.headers.get('host')}`;
    
    const confirmationLink = `${baseUrl}/confirm-email?token=${confirmationToken}`;

    await transporter.sendMail({
      from: `vaguinhas <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Confirme seu e-mail - vaguinhas",
      html: `
        <div style="max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ff914d; font-size: 24px;">Confirmação de e-mail</h1>
          <p>Clique no link abaixo para confirmar seu endereço de e-mail:</p>
          <a href="${confirmationLink}" style="color: #ff914d; text-decoration: none;">
            Confirmar e-mail
          </a>
          <p>Se você não solicitou este e-mail, por favor ignore.</p>
        </div>
      `
    });

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