// app/api/payment/stripe/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
export async function POST(request: Request) {
  try {
    // Validate environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe secret key not configured' },
        { status: 500 }
      );
    }

    if (!process.env.NEXTAUTH_URL) {
      return NextResponse.json(
        { error: 'NEXTAUTH_URL not configured' },
        { status: 500 }
      );
    }

    // Parse request body
    const { email } = await request.json();

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Premium Plan',
            },
            unit_amount: 979, // Amount in cents (R$9.79)
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/`,
      customer_email: email,
      metadata: {
        user_email: email,
        product: 'Premium Plan'
      }
    });

    // Return the session URL to the client
    return NextResponse.json({
      data: {
        url: session.url
      }
    });
    
  } catch (error: unknown) {
    console.error('Stripe Checkout Error:', {
      message: error.message,
      stack: error.stack,
      raw: error.raw || 'No raw error'
    });

    return NextResponse.json(
      { 
        error: 'Payment processing failed',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}