import { connectToDatabase } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    
    if (!token) {
      return NextResponse.json(
        { message: "Token é obrigatório" },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Find and validate token
    const magicLink = await db.collection("magic_links").findOne({
      token,
      used: false,
      expires: { $gt: new Date() }
    });
    
    if (!magicLink) {
      return NextResponse.json(
        { message: "Link inválido ou expirado" },
        { status: 401 }
      );
    }
    
    // Get user
    const user = await db.collection("users").findOne({
      _id: magicLink.userId
    });
    
    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }
    
    // Mark token as used
    await db.collection("magic_links").updateOne(
      { _id: magicLink._id },
      { $set: { used: true, usedAt: new Date() } }
    );
    
    // Create session token
    const sessionToken = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );
    
    return NextResponse.json({
      message: "Login realizado com sucesso!",
      token: sessionToken,
      userId: user._id.toString()
    });
    
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { message: "Erro na verificação" },
      { status: 500 }
    );
  }
}