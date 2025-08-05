// app/api/payments/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectToDatabase } from '@/lib/mongodb';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session_id parameter' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get the user email from the session
    const email = session.customer_details?.email || session.metadata?.user_email;

    if (!email) {
      return NextResponse.json({
        status: session.payment_status,
        message: 'Payment verified but no email found'
      });
    }

    // Connect to database and find the user
    const { db } = await connectToDatabase();
    const user = await db.collection("users").findOne({ 
      email: email.toLowerCase() 
    });

    if (!user) {
      console.warn(`Payment successful but user not found: ${email}`);
      return NextResponse.json({
        status: session.payment_status,
        email: email,
        message: 'Payment verified but user not found in database'
      });
    }

    // Return payment status with user information
    return NextResponse.json({
      status: session.payment_status,
      userId: user._id.toString(), // Convert ObjectId to string
      email: user.email,
      subscriptionType: user.subscriptionType,
      stripeSessionId: sessionId
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}