import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const users = await db.collection("users").find({}).toArray();

    if (!users.length) {
      return NextResponse.json(
        { message: "No users found" },
        { status: 404 }
      );
    }

    const results = [];
    const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';

    for (const user of users) {
      // Generate random 12-character password
      const plainPassword = Array.from({ length: 12 }, () => 
        charSet[Math.floor(Math.random() * charSet.length)]
      ).join('');

      // Hash password before storing
      const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);

      // Update user with hashed password
      await db.collection("users").updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword } }
      );

      // Store results (with plain password for one-time disclosure)
      results.push({
        userId: user._id.toString(),
        email: user.email,
        generatedPassword: plainPassword
      });
    }

    return NextResponse.json({
      message: "Passwords generated and hashed successfully",
      count: results.length,
      results
    }, { status: 200 });

  } catch (error) {
    console.error("Password generation failed:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}