import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { sendConfirmEmailReminder, generateConfirmationToken } from '@/lib/email';

export async function GET(request: NextRequest) {
  // Verify secret token
  const secret = request.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { db } = await connectToDatabase();
    // const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Find users who:
    // - Aren't confirmed
    // - Registered in the last week
    const users = await db.collection("users").find({
      confirmed: false,
    //   createdAt: { $gte: oneWeekAgo }
    }).toArray();

    let processed = 0;
    for (const user of users) {
      const newToken = generateConfirmationToken();
      const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await db.collection("users").updateOne(
        { _id: user._id },
        { $set: { 
            confirmationToken: newToken,
            confirmationExpires: newExpiry 
        }}
      );

      await sendConfirmEmailReminder(user.email, newToken);
      processed++;
    }

    return NextResponse.json({
      message: `Resent confirmations to ${processed} users`
    }, { status: 200 });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}