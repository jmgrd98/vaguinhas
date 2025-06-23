// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { z } from "zod";

const updateSchema = z.object({
  seniorityLevel: z.string().min(1, "Seniority level is required"),
  stacks: z.array(z.string()).min(1, "At least one stack is required"),
});

export async function GET(req: NextRequest, params: { params: { id: string } }) {
  const { params: { id } } = params;

  try {
    const { db } = await connectToDatabase();
    
    if (!ObjectId.isValid(id)) { // Use destructured 'id'
      return NextResponse.json(
        { message: "Invalid user ID format" },
        { status: 400 }
      );
    }

    const user = await db.collection("users").findOne({ 
      _id: new ObjectId(id) // Use destructured 'id'
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const { _id, email, seniorityLevel, stacks, confirmed, createdAt } = user;
    return NextResponse.json({
      _id: _id.toString(),
      email,
      seniorityLevel,
      stacks,
      confirmed,
      createdAt
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params; // Destructure here

  try {
    const { db } = await connectToDatabase();
    
    if (!ObjectId.isValid(id)) { // Use destructured 'id'
      return NextResponse.json(
        { message: "Invalid user ID format" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validation = updateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          message: "Validation error",
          errors: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { seniorityLevel, stacks } = validation.data;

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: { seniorityLevel, stacks } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "User preferences updated successfully" },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}