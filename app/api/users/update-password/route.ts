import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
// import { ObjectId } from "mongodb";
import { z } from "zod";
import bcrypt from "bcryptjs";

const requestSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
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
    
    const { token, newPassword } = validation.data;
    const { db } = await connectToDatabase();
    
    const user = await db.collection("users").findOne({ 
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });
    
    if (!user) {
      return NextResponse.json(
        { message: "Token inválido ou expirado" },
        { status: 400 }
      );
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: { resetToken: "", resetTokenExpiry: "" }
      }
    );
    
    // Return user ID in the response
    return NextResponse.json(
      { 
        message: "Senha atualizada com sucesso!",
        userId: user._id.toString() // Convert ObjectId to string
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password update error:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}