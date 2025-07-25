import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const expectedToken = `Bearer ${process.env.NEXT_PUBLIC_JWT_SECRET}`;
    
    if (authHeader !== expectedToken) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

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
        { message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      userId: user._id.toString(),
      email: user.email,
      confirmed: user.confirmed
    });
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}