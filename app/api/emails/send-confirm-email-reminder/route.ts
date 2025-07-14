import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { sendConfirmEmailReminder } from '@/lib/email';
import generateConfirmationToken from '@/lib/generateConfirmationToken';
import { LRUCache } from "lru-cache";

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
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token || token !== process.env.JWT_SECRET) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }


  if (isRateLimited(token)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again in 30 minutes." },
        { status: 429 }
      );
    }

  try {
    const { db } = await connectToDatabase();
    
    // Calculate time thresholds
    const now = new Date();
    
    // Find unconfirmed users who need reminders
    const users = await db.collection("users").find({
      confirmed: false,
    }).toArray();
    
    let processed = 0;
    let skipped = 0;
    
    for (const user of users) {
      try {
        // Generate new token with 7-day expiration
        const newToken = generateConfirmationToken();
        const newExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        // Update user with new token and reminder tracking
        const updateResult = await db.collection("users").updateOne(
          { _id: user._id },
          { 
            $set: { 
              confirmationToken: newToken,
              confirmationExpires: newExpiry,
              lastReminderSent: new Date()
            },
            $inc: { reminderCount: 1 }
          }
        );
        
        if (updateResult.modifiedCount === 0) {
          skipped++;
          continue;
        }
        
        // Send email with exponential backoff
        await sendConfirmEmailReminder(user.email, newToken);
        processed++;
      } catch (error) {
        console.error(`Failed to process user ${user.email}:`, error);
        skipped++;
      }
    }

    return NextResponse.json({
      message: `Cron job completed. Reminders sent: ${processed}, Skipped: ${skipped}`
    }, { status: 200 });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}