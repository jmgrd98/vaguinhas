import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
// import { sendConfirmEmailReminder } from '@/lib/resend';
import { sendConfirmEmailReminder } from '@/lib/email';
import generateConfirmationToken from '@/lib/generateConfirmationToken';
import sendBatchEmails from '@/lib/sendBatchEmails';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const now = new Date();
    
    const users = await db.collection("users").find({
      confirmed: false,
    }).toArray();
    
    let processed = 0;
    let skipped = 0;

    // Prepare email sending tasks
    const emailTasks: (() => Promise<void>)[] = [];
    
    for (const user of users) {
      try {
        const newToken = generateConfirmationToken();
        const newExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        // Update user first - this doesn't need to be batched
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
        
        // Create email sending task
        emailTasks.push(async () => {
          try {
            await sendConfirmEmailReminder(user.email, newToken);
            processed++;
          } catch (error) {
            console.error(`Failed to send to ${user.email}:`, error);
            skipped++;
          }
        });
      } catch (error) {
        console.error(`Failed to process user ${user.email}:`, error);
        skipped++;
      }
    }

    // Execute email tasks in batches
    if (emailTasks.length > 0) {
      console.log(`Processing ${emailTasks.length} email tasks in batches`);
      
      // We'll use our existing batch email function by wrapping the tasks
      await sendBatchEmails(
        emailTasks.map((_, i) => i.toString()), // Dummy "emails" array
        async (index) => {
          await emailTasks[parseInt(index)]();
        },
        5, // Batch size
        1500 // Delay between batches
      );
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