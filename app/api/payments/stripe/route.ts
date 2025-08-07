// app/api/payments/stripe/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

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
    const { email, billingType } = await request.json();

    // Validate billingType
    if (!billingType || !['monthly', 'lifetime'].includes(billingType)) {
      return NextResponse.json(
        { error: 'Invalid billing type' },
        { status: 400 }
      );
    }

    // Determine price based on billing type
    const priceData = {
      monthly: {
        name: 'Plano Premium Mensal',
        unit_amount: 979, // R$29.00 in cents
      },
      lifetime: {
        name: 'Plano Premium Vitalício',
        unit_amount: 3979, // R$299.00 in cents
      }
    };

    const selectedPrice = priceData[billingType as keyof typeof priceData];

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: selectedPrice.name,
            },
            unit_amount: selectedPrice.unit_amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/planos`,
      customer_email: email || undefined, // Only set if email exists
      metadata: {
        user_email: email || 'unknown',
        product: selectedPrice.name,
        billing_type: billingType
      },
    //   billing_address_collection: '',
      phone_number_collection: {
        enabled: true,
      },
    });

    // Return the session URL to the client
    return NextResponse.json({
      data: {
        url: session.url
      }
    });
    
  } catch (error: unknown) {
    console.error('Stripe session creation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Payment verification failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}