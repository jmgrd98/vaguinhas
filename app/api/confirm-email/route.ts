import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { message: "Token inválido" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const user = await db.collection("users").findOne({
      confirmationToken: token,
      confirmationExpires: { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json(
        { message: "Token inválido ou expirado" },
        { status: 400 }
      );
    }

    if (user.confirmed) {
      return NextResponse.json(
        { message: "Esse e-mail já está confirmado." },
        { status: 409 }
      );
    }

    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: { confirmed: true },
        $unset: { confirmationToken: "", confirmationExpires: "" }
      }
    );

    return NextResponse.json(
      { message: "E-mail confirmado com sucesso!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Erro ao confirmar e-mail" },
      { status: 500 }
    );
  }
}