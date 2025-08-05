// app/success/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircleIcon } from 'lucide-react';
import { FaExclamation } from 'react-icons/fa';
import Link from 'next/link';

interface PaymentVerificationResult {
  status: string;
  userId?: string;
  email?: string;
  subscriptionType?: string;
}

export default function SuccessPage() {
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('Verifying your payment...');
  const [userId, setUserId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        if (!sessionId) {
          throw new Error('Missing payment session ID');
        }

        const response = await fetch(`/api/payments/verify?session_id=${sessionId}`);
        
        if (!response.ok) {
          throw new Error(`Verification failed: ${response.status}`);
        }

        const result: PaymentVerificationResult = await response.json();
        
        if (result.status === 'paid') {
          setPaymentStatus('success');
          setMessage('Payment successful! Thank you for your purchase.');
          
          // Store the user ID for redirect
          if (result.userId) {
            setUserId(result.userId);
          }
        } else {
          setPaymentStatus('failed');
          setMessage(`Payment status: ${result.status || 'unpaid'}`);
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setPaymentStatus('failed');
        setMessage(error instanceof Error ? error.message : 'Payment verification failed');
      }
    };

    verifyPayment();
  }, [sessionId]);

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen flex flex-col justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8">
        {paymentStatus === 'loading' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Processando pagamento</h1>
            <p className="text-gray-600">{message}</p>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Pagamento bem-sucedido!</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <p className="text-green-700">
                Seu plano premium foi ativado. Você vai passar a receber vaguinhas todos os dias.
              </p>
            </div>
            <Link 
              href={userId ? `/assinante/${userId}` : '/'} 
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              {userId ? 'Ir para sua página' : 'Ir para página inicial'}
            </Link>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="text-center">
            <FaExclamation className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Erro com o pagamento</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="bg-yellow-50 rounded-lg p-4 mb-6">
              <p className="text-yellow-700">
                Se você foi cobrado, por favor entrar em contato com o suporte e informe seu ID de pagamento.
              </p>
            </div>
            <div className="flex justify-center gap-4">
              <Link 
                href="/planos" 
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Tente de novo
              </Link>
              <Link 
                href="/support" 
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                Falar com suporte
              </Link>
            </div>
          </div>
        )}

        {sessionId && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">ID de pagamento: {sessionId}</p>
          </div>
        )}
      </div>
    </div>
  );
}