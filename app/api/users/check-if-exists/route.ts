// app/api/users/check-exists/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { z } from "zod";

const checkUserSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${process.env.NEXT_PUBLIC_JWT_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const body = await req.json();
    
    const validation = checkUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          message: "Validation error",
          errors: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Check if user exists and has completed profile
    const user = await db.collection("users").findOne(
      { email: email.toLowerCase() },
      { 
        projection: { 
          _id: 1, 
          email: 1, 
          confirmed: 1, 
          stacks: 1, 
          seniorityLevel: 1,
          oauthProvider: 1 
        } 
      }
    );

    if (user && user.stacks?.length > 0 && user.seniorityLevel) {
      // User exists with complete profile
      return NextResponse.json({
        exists: true,
        user: {
          _id: user._id.toString(),
          email: user.email,
          confirmed: user.confirmed,
          hasCompleteProfile: true
        }
      });
    } else if (user) {
      // User exists but incomplete profile
      return NextResponse.json({
        exists: true,
        user: {
          _id: user._id.toString(),
          email: user.email,
          confirmed: user.confirmed,
          hasCompleteProfile: false
        }
      });
    } else {
      // User doesn't exist
      return NextResponse.json({
        exists: false
      });
    }
    
  } catch (error) {
    console.error("Error checking user existence:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}