import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { z } from "zod";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

const requestSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const validation = requestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid request", errors: validation.error.errors },
        { status: 400 }
      );
    }
    
    const { email } = validation.data;
    const { db } = await connectToDatabase();
    
    // Find user by email
    const user = await db.collection("users").findOne({ email });
    
    if (!user) {
      return NextResponse.json(
        { message: "Nenhum usuário encontrado com este e-mail" },
        { status: 404 }
      );
    }
    
    // Generate reset token and expiration (1 hour)
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000;
    
    // Update user with reset token
    await db.collection("users").updateOne(
      { email },
      {
        $set: {
          resetToken,
          resetTokenExpiry,
        }
      }
    );
    
    // Send password reset email
    await sendPasswordResetEmail(email, resetToken);
    
    return NextResponse.json(
      { message: "E-mail de redefinição enviado com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}