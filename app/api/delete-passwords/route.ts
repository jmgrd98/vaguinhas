import {  NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function DELETE() {
  try {
    const { db } = await connectToDatabase();
    
    // Remove password field from all users
    const result = await db.collection("users").updateMany(
      {},
      { $unset: { password: "" } }
    );

    return NextResponse.json({
      message: "Passwords deleted successfully",
      modifiedCount: result.modifiedCount
    }, { status: 200 });

  } catch (error) {
    console.error("Failed to delete passwords:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}