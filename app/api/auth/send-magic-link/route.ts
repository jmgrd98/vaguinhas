// app/api/auth/send-magic-link/route.ts
import { connectToDatabase } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sendMagicLinkEmail } from "@/lib/email";


export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    const user = await db.collection("users").findOne({ 
      email: email.toLowerCase() 
    });
    
    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }
    
    if (!user.confirmed) {
      return NextResponse.json(
        { message: "E-mail não confirmado" },
        { status: 403 }
      );
    }
    
    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 hour
    
    // Store token in database
    await db.collection("magic_links").insertOne({
      userId: user._id,
      email: user.email,
      token,
      expires,
      used: false,
      createdAt: new Date()
    });
    
    // Send email with magic link
    await sendMagicLinkEmail(email, token);
    
    return NextResponse.json({ 
      message: "Link de acesso enviado para seu e-mail!" 
    });
  } catch (error) {
    console.error("Magic link error:", error);
    return NextResponse.json(
      { message: "Erro ao enviar link de acesso" },
      { status: 500 }
    );
  }
}