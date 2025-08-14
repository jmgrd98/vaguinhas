// app/api/auth/send-magic-link/route.ts
import { connectToDatabase } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken"; // Changed from crypto
import { sendMagicLinkEmail } from "@/lib/email.tsx";

// app/api/auth/send-magic-link/route.ts
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
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email,
        type: 'magic-link'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );
    
    // Store token in database
    await db.collection("magic_links").insertOne({
      userId: user._id,
      email: user.email,
      token,
      expires: new Date(Date.now() + 15 * 60 * 1000),
      used: false,
      createdAt: new Date()
    });
    
    // Pass just the TOKEN, not the URL
    await sendMagicLinkEmail(user.email, token); // ✅ Pass token only
    
    return NextResponse.json({ 
      message: "Link de acesso enviado para seu e-mail!",
      success: true
    });
  } catch (error) {
    console.error("Magic link error:", error);
    return NextResponse.json(
      { message: "Erro ao enviar link de acesso" },
      { status: 500 }
    );
  }
}