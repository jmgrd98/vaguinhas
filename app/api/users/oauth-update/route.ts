// app/api/users/oauth-update/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { z } from "zod";
import { UpdateData } from "../[id]/route";

const oauthUpdateSchema = z.object({
  email: z.string().email(),
  stack: z.string().min(1),
  seniorityLevel: z.string().min(1),
  provider: z.string().optional(),
  providerId: z.string().optional(),
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

    const { email, stack, seniorityLevel, provider, providerId } = validation.data;

    // Check if user exists
    const user = await db.collection("users").findOne({ email });

    if (user) {
      // Update existing user
      const updateData: UpdateData = {
        seniorityLevel,
        stacks: [stack],
        updatedAt: new Date(),
      };

      if (provider && providerId) {
        updateData.oauthProvider = provider;
        updateData.oauthProviderId = providerId;
      }

      await db.collection("users").updateOne(
        { email },
        { $set: updateData }
      );

      return NextResponse.json({
        success: true,
        userId: user._id.toString(),
        email: user.email,
        isNewUser: false,
      }, { status: 200 });
    } else {
      // Create new user for OAuth sign-up
      const newUser = {
        email,
        seniorityLevel,
        stacks: [stack],
        confirmed: true, // OAuth users are pre-confirmed
        isActive: true,
        oauthProvider: provider,
        oauthProviderId: providerId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection("users").insertOne(newUser);

      // Send welcome email for new OAuth users
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/emails/send-welcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_JWT_SECRET}`,
        },
        body: JSON.stringify({ email, isOAuthUser: true }),
      }).catch(err => console.error('Failed to send welcome email:', err));

      return NextResponse.json({
        success: true,
        userId: result.insertedId.toString(),
        email,
        isNewUser: true,
      }, { status: 201 });
    }
    
  } catch (error) {
    console.error("Error in OAuth update:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}