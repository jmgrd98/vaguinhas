import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

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
    await db.collection("emails").insertOne({
      email: email.toLowerCase(),
      createdAt: new Date(),
    });

    return NextResponse.json({ message: "E-mail salvo" }, { status: 201 });
  } catch (error) {
    console.error("MongoDB error:", error);
    return NextResponse.json(
      { message: "Erro ao salvar e-mail" },
      { status: 500 }
    );
  }
}

// Optionally, to reject other methods:
export async function GET() {
  return NextResponse.json(
    { message: "Method not allowed" },
    { status: 405 }
  );
}
