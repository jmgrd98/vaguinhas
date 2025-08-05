// app/api/payment/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: NextRequest) {
  try {
    // Get session_id from query parameters
    const sessionId = request.nextUrl.searchParams.get('session_id');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session ID' },
        { status: 400 }
      );
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });

    return NextResponse.json({
      status: session.payment_status,
      amount: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency,
      email: session.customer_details?.email,
      created: new Date(session.created * 1000).toISOString(),
      product: session.metadata?.product || 'Premium Plan'
    });
    
  } catch (error: any) {
    console.error('Payment verification error:', {
      message: error.message,
      code: error.code,
      type: error.type
    });

    return NextResponse.json(
      { 
        error: 'Payment verification failed',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}