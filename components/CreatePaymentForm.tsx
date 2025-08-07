// components/CreatePaymentForm.tsx
'use client';

import { useState, FormEvent } from 'react';
import { Button } from './ui/button';

interface PaymentResponse {
  data: {
    url: string;
  };
  error?: string;
}

interface CreatePaymentFormProps {
  userEmail?: string;
  buttonText?: string;
  billingType?: "monthly" | "lifetime";
}

export default function CreatePaymentForm({
  userEmail,
  buttonText = "Pagar Agora",
  billingType = "monthly"
}: CreatePaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<PaymentResponse | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: userEmail || '',
          billingType,
        })
      });

      const result: PaymentResponse = await response.json();
      
      if (response.ok && result.data?.url) {
        console.log('Payment URL:', result.data.url);
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
        <Button
          type="submit" 
          disabled={loading}
          className="w-full bg-[#ff914d] hover:bg-[#ff914d] cursor-pointer text-white font-bold py-4 px-6 rounded-lg transition-colors duration-300"
        >
          {loading ? 'Processando...' : buttonText}
        </Button>
      </form>
      
      {payment && payment.data?.url && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p>Redirecionando para pagamento...</p>
          <a 
            href={payment.data.url} 
            className="mt-2 inline-block text-blue-600 underline"
          >
            Clique aqui se não for redirecionado
          </a>
        </div>
      )}
    </div>
  );
}