// app/api/auth/verify-magic-link/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    
    if (!token) {
      return NextResponse.json(
        { message: 'Token is required' },
        { status: 400 }
      );
    }
    
    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        type: string;
      };
    } catch (error: unknown) {
      console.error("❌ Error verifying token:", error);
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    // Check if it's a magic link token
    if (decoded.type !== 'magic-link') {
      return NextResponse.json(
        { message: 'Invalid token type' },
        { status: 401 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Check if token exists in database and hasn't been used
    const magicLink = await db.collection("magic_links").findOne({
      token,
      used: false,
      expires: { $gt: new Date() }
    });
    
    if (!magicLink) {
      return NextResponse.json(
        { message: 'Token not found or already used' },
        { status: 401 }
      );
    }
    
    // Mark token as used
    await db.collection("magic_links").updateOne(
      { _id: magicLink._id },
      { $set: { used: true } }
    );
    
    // Get user details
    const user = await db.collection("users").findOne({
      _id: new ObjectId(decoded.userId)
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      success: true
    });
    
  } catch (error) {
    console.error('Verify magic link error:', error);
    return NextResponse.json(
      { message: 'Failed to verify magic link' },
      { status: 500 }
    );
  }
}