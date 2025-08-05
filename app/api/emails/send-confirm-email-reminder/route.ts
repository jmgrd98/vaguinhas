import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
// import { sendConfirmEmailReminder } from '@/lib/email';
import generateConfirmationToken from '@/lib/generateConfirmationToken';
import isRateLimited from '@/utils/isRateLimited';
import { getEmailQueue } from '@/lib/emailQueue'; // Import queue


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
        
          await getEmailQueue().add(
          `confirm-reminder`, // Job name
          {
            jobType: "confirm-reminder",
            email: user.email,
            token: newToken
          },
          {
            attempts: 3,
            backoff: { type: "exponential", delay: 1000 }
          }
        );
        
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