
import { NextResponse } from 'next/server';
import {AbacatePay} from 'abacatepay-nodejs-sdk';

// Initialize SDK with environment variables
const abacate = new AbacatePay(process.env.ABACATEPAY_API_KEY!);

export async function POST(request: Request) {
  try {
    // Validate API key
    if (!process.env.ABACATEPAY_API_KEY) {
      return NextResponse.json(
        { error: 'AbacatePay API key not configured' },
        { status: 500 }
      );
    }

    const paymentData = await request.json();

    console.log('PAYMENT DATA', paymentData);
    // Create payment with AbacatePay SDK
    const payment = await abacate.billing.create({
            frequency: "MULTIPLE_PAYMENTS",
            methods: ["PIX"],
            products: [{
                externalId: "PRODUCT_123",
                name: "Premium Plan",
                quantity: 1,
                price: 979,
                currency: "BRL"
            }],
            returnUrl: `${process.env.NEXTAUTH_URL}/`,
            completionUrl:  `${process.env.NEXTAUTH_URL}/success`,
            customer: {
                email: paymentData.email,
                name: "",
                cellphone: "",
                taxId: "",
            }
            });
    console.log('PAYMENT', payment);
    return NextResponse.json(payment);
    
  } catch (error: unknown) {
    if (error instanceof Error) {
        console.error('Payment creation error:', error);
        return NextResponse.json(
        { 
            error: 'Payment processing failed',
            details: error.message || 'Unknown error'
        },
        { status: 500 }
        );
    } else {
        console.error('Unknown error:', error);
        return NextResponse.json(
        { 
            error: 'Unknown error'
        },
        { status: 500 }
        );
    }
    }
}