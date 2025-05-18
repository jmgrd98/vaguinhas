import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { createTransport } from "nodemailer";

// Configure your email service here
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

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { message: "Email inválido" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const normalizedEmail = email.toLowerCase();

    // Check if email already exists
    const existing = await db.collection("emails").findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json(
        { message: "Este e-mail já está cadastrado" },
        { status: 409 }
      );
    }

    // Insert new email
    await db.collection("emails").insertOne({
      email: normalizedEmail,
      createdAt: new Date(),
      confirmed: false, // Add confirmation status
    });

    // Send confirmation email
    const mailOptions = {
      from: `Vaguinhas <${process.env.EMAIL_FROM}>`,
      to: normalizedEmail,
      subject: "Confirmação de cadastro - Vaguinhas",
      html: `
        <h1>Obrigado por se cadastrar!</h1>
        <p>Você receberá vagas de tecnologia diariamente em seu e-mail.</p>
        <p>Caso não tenha sido você, por favor ignore este e-mail.</p>
        <hr>
        <small>Equipe Vaguinhas</small>
      `,
    };

    console.log("Sending confirmation email:", mailOptions);

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: "E-mail salvo e confirmação enviada" }, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    
    // Specific error handling for email sending
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