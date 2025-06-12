import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { sendConfirmEmailReminder, generateConfirmationToken } from '@/lib/email';

export async function GET() {
  // Enhanced secret validation
  // const secret = request.nextUrl.searchParams.get('secret');
  // if (!secret || secret !== process.env.CRON_SECRET) {
  //   console.warn('Unauthorized cron job attempt');
  //   return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const { db } = await connectToDatabase();
    
    // Calculate time thresholds
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Find unconfirmed users who need reminders
    const users = await db.collection("users").find({
      confirmed: false,
      $or: [
        // First reminder: 2 days after registration
        {
          createdAt: { 
            $gte: twoDaysAgo,
            $lt: new Date(twoDaysAgo.getTime() + 1 * 60 * 60 * 1000) // 1-hour window
          },
          lastReminderSent: { $exists: false }
        },
        // Follow-up reminder: 7 days after registration
        {
          createdAt: { $lte: oneWeekAgo },
          lastReminderSent: { $lte: oneWeekAgo },
          reminderCount: { $lt: 3 } // Max 3 reminders
        }
      ]
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
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}