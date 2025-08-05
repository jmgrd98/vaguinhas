// components/CreatePaymentForm.tsx
'use client';

import { useState, FormEvent } from 'react';

interface PaymentResponse {
  data: {
    url: string;
  };
  error?: string;
}

interface CreatePaymentFormProps {
  userEmail?: string;
}

export default function CreatePaymentForm({
  userEmail
}: CreatePaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'abacate'>('stripe');
  const [payment, setPayment] = useState<PaymentResponse | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Determine API endpoint based on selected payment method
      const endpoint = paymentMethod === 'stripe' 
        ? '/api/payments/stripe' 
        : '/api/payments/abacate';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: userEmail,
          // Add any other required data here
        })
      });

      const result: PaymentResponse = await response.json();
      
      if (response.ok && result.data?.url) {
        setPayment(result);
        window.location.href = result.data.url;
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Payment Method
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="paymentMethod"
                checked={paymentMethod === 'stripe'}
                onChange={() => setPaymentMethod('stripe')}
                className="mr-2"
              />
              <span>Stripe</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="paymentMethod"
                checked={paymentMethod === 'abacate'}
                onChange={() => setPaymentMethod('abacate')}
                className="mr-2"
              />
              <span>AbacatePay</span>
            </label>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
      </form>
      
      {payment && payment.data?.url && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p>Payment created! Redirecting...</p>
          <a 
            href={payment.data.url} 
            className="mt-2 inline-block text-blue-600 underline"
          >
            Click here if not redirected
          </a>
        </div>
      )}
    </div>
  );
}