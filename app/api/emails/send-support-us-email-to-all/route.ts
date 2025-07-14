// Alternative streaming approach
import { NextResponse } from "next/server";
import sendBatchEmails from "@/lib/sendBatchEmails";
import { sendSupportUsEmail } from "@/lib/email";
import { connectToDatabase } from "@/lib/mongodb";
import { LRUCache } from "lru-cache";

const DB_PAGE_SIZE = 500;
const EMAIL_BATCH_SIZE = 10;
const BATCH_DELAY = 1500;

// Initialize rate limiter only in production
const rateLimitCache = process.env.NODE_ENV === "production" 
  ? new LRUCache<string, number[]>({
      max: 100,
      ttl: 30 * 60 * 1000, // 30 minutes
    })
  : null;

function isRateLimited(token: string, limit = 5) {
  // Bypass rate limiting in non-production environments
  if (!rateLimitCache || process.env.NODE_ENV !== "production") return false;
  
  const tokenCount = rateLimitCache.get(token) || [0];
  if (tokenCount[0] >= limit) return true;
  
  rateLimitCache.set(token, [tokenCount[0] + 1]);
  return false;
}


export async function GET(req: Request) {
  // Authentication
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token || token !== process.env.JWT_SECRET) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Rate limiting (production only)
  if (isRateLimited(token)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in 30 minutes." },
      { status: 429 }
    );
  }
  
  try {
    const { db } = await connectToDatabase();
    const cursor = db.collection("users").find({});
    let totalEmails = 0;
    let emailBatch: string[] = [];
    
    while (await cursor.hasNext()) {
      const user = await cursor.next();
      if (user?.email) {
        emailBatch.push(user.email);
        totalEmails++;
      }
      
      // Process batch when full
      if (emailBatch.length >= DB_PAGE_SIZE) {
        await sendBatchEmails(
          emailBatch,
          sendSupportUsEmail,
          EMAIL_BATCH_SIZE,
          BATCH_DELAY
        );
        emailBatch = [];
      }
    }
    
    // Process remaining emails
    if (emailBatch.length > 0) {
      await sendBatchEmails(
        emailBatch,
        sendSupportUsEmail,
        EMAIL_BATCH_SIZE,
        BATCH_DELAY
      );
    }
    
    if (totalEmails === 0) {
      return NextResponse.json(
        { error: "No valid subscribers found" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: `Emails processed for ${totalEmails} recipients` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email sending failed:", error);
    return NextResponse.json(
      { error: "Email processing error" },
      { status: 500 }
    );
  }
}