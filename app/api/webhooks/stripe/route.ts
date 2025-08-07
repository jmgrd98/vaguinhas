// app/api/webhooks/stripe/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { generatePassword } from '@/lib/generatePassword';
import generateConfirmationToken from '@/lib/generateConfirmationToken';
import { ObjectId } from 'mongodb';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

const SALT_ROUNDS = 12;

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  console.log(`✅ Webhook received: ${event.type}`);

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    try {
      await handleCheckoutSessionCompleted(session);
      console.log('✅ Checkout session processed successfully');
    } catch (error) {
      console.error('❌ Error processing checkout session:', error);
      // Return 200 to acknowledge receipt even if processing failed
      // You might want to implement a retry mechanism or alert system here
      return NextResponse.json({ 
        received: true, 
        warning: 'Processing failed, manual intervention may be required' 
      });
    }
  } else {
    console.log(`ℹ️ Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  // Extract user information
  const email = session.customer_details?.email || session.metadata?.user_email;
  const billingType = session.metadata?.billing_type as 'monthly' | 'lifetime';
  const customerName = session.customer_details?.name || '';
  const customerPhone = session.customer_details?.phone || '';
  
  if (!email) {
    throw new Error('No email found in checkout session');
  }

  if (!billingType) {
    throw new Error('No billing type found in checkout session metadata');
  }

  console.log('Processing payment for:', {
    email,
    billingType,
    sessionId: session.id,
    customerId: session.customer
  });

  // Connect to database
  const { db } = await connectToDatabase();
  
  // Check if user exists
  const existingUser = await db.collection("users").findOne({ 
    email: email.toLowerCase() 
  });
  
  // Calculate subscription dates
  const now = new Date();
  let subscriptionEnd: Date | null = null;
  
  if (billingType === 'monthly') {
    subscriptionEnd = new Date(now);
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
  }
  // For lifetime, subscriptionEnd remains null

  if (existingUser) {
    // Update existing user
    const updateResult = await db.collection("users").updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          status: 'premium',
          subscriptionType: billingType,
          paymentMethod: 'stripe',
          subscriptionStart: now,
          subscriptionEnd,
          stripeCustomerId: session.customer as string || undefined,
          stripeSessionId: session.id,
          lastPaymentDate: now,
          lastPaymentAmount: session.amount_total,
          updatedAt: now,
          // Update name and phone if available
          ...(customerName && { name: customerName }),
          ...(customerPhone && { phone: customerPhone })
        }
      }
    );
    
    if (updateResult.modifiedCount === 0) {
      throw new Error(`Failed to update user: ${email}`);
    }
    
    console.log(`✅ Updated existing user to premium: ${email} (ID: ${existingUser._id})`);
    
    // TODO: Send upgrade confirmation email
    // await sendUpgradeEmail(email, billingType);
    
  } else {
    // Create new user
    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
    const confirmationToken = generateConfirmationToken();
    
    const newUser = {
      _id: new ObjectId(), // Explicitly create ObjectId
      email: email.toLowerCase(),
      name: customerName || '',
      phone: customerPhone || '',
      status: 'premium',
      subscriptionType: billingType,
      paymentMethod: 'stripe',
      subscriptionStart: now,
      subscriptionEnd,
      stripeCustomerId: session.customer as string || undefined,
      stripeSessionId: session.id,
      lastPaymentDate: now,
      lastPaymentAmount: session.amount_total,
      isConfirmed: true, // Auto-confirm since they paid
      unsubscribed: false,
      createdAt: now,
      updatedAt: now,
      password: hashedPassword,
      confirmationToken,
      // Profile fields (can be updated later)
      seniorityLevel: '',
      stack: '',
      skills: [],
      bio: '',
      profileComplete: false
    };
    
    const insertResult = await db.collection("users").insertOne(newUser);
    
    if (!insertResult.insertedId) {
      throw new Error(`Failed to create user: ${email}`);
    }
    
    console.log(`✅ Created new premium user: ${email} (ID: ${insertResult.insertedId})`);
    console.log(`📧 Temporary password generated for ${email}: [hidden]`);
    
    // TODO: Send welcome email with login credentials
    // await sendWelcomeEmail(email, plainPassword, billingType);
  }
  
  // Optional: Store the payment record for history
  await db.collection("payments").insertOne({
    userId: existingUser?._id || new ObjectId(),
    email: email.toLowerCase(),
    stripeSessionId: session.id,
    stripeCustomerId: session.customer,
    amount: session.amount_total,
    currency: session.currency,
    status: 'completed',
    billingType,
    createdAt: now
  });
  
  console.log('💾 Payment record saved');
}

export const runtime = 'nodejs';