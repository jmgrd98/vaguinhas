// app/api/users/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { z } from "zod";

const updateSchema = z.object({
  seniorityLevel: z.string().min(1, "Seniority level is required"),
  stacks: z.array(z.string()).min(1, "At least one stack is required"),
});

const oauthUpdateSchema = z.object({
  email: z.string().email(),
  stack: z.string().optional(),
  stacks: z.array(z.string()).optional(),
  seniorityLevel: z.string().min(1),
  provider: z.string().optional(),
  providerId: z.string().optional(),
});

export interface UpdateData {
  seniorityLevel: string;
  stacks: string[];
  updatedAt: Date;
  oauthProvider?: string;
  oauthProviderId?: string;
  givenName?: string;
  familyName?: string;
  location?: string;
  headline?: string;
  industry?: string;
  profileUrl?: string;
  emailType?: string;
}


export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const { db } = await connectToDatabase();
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid user ID format" },
        { status: 400 }
      );
    }

    const user = await db.collection("users").findOne({ 
      _id: new ObjectId(id)
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

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const { db } = await connectToDatabase();
    
    if (!ObjectId.isValid(id)) {
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

// Add POST handler for OAuth updates
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const { db } = await connectToDatabase();
    
    const body = await req.json();
    const validation = oauthUpdateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          message: "Validation error",
          errors: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { email, stack, stacks, seniorityLevel, provider, providerId } = validation.data;
    
    // Convert stack to stacks array if needed
    const stacksArray = stacks || (stack ? [stack] : []);

    // First, try to find user by email (since id parameter might be email)
    let user = await db.collection("users").findOne({ email });
    
    if (!user) {
      // If not found by email, check if id is a valid ObjectId
      if (ObjectId.isValid(id)) {
        user = await db.collection("users").findOne({ _id: new ObjectId(id) });
      }
    }

    if (user) {
      // Update existing user
      const updateData: UpdateData  = {
        seniorityLevel,
        stacks: stacksArray,
        updatedAt: new Date(),
      };

      if (provider && providerId) {
        updateData.oauthProvider = provider;
        updateData.oauthProviderId = providerId;
      }

      await db.collection("users").updateOne(
        { _id: user._id },
        { $set: updateData }
      );

      return NextResponse.json({
        message: "User updated successfully",
        userId: user._id.toString(),
        email: user.email,
      }, { status: 200 });
    } else {
      // Create new user for OAuth sign-up
      const newUser = {
        email,
        seniorityLevel,
        stacks: stacksArray,
        confirmed: true, // OAuth users are pre-confirmed
        isActive: true,
        oauthProvider: provider,
        oauthProviderId: providerId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection("users").insertOne(newUser);

      return NextResponse.json({
        message: "User created successfully",
        userId: result.insertedId.toString(),
        email,
      }, { status: 201 });
    }
    
  } catch (error) {
    console.error("Error updating/creating user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}