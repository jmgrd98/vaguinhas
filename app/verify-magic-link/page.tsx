'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

export default function MagicLinkVerification() {
  const router = useRouter();
  const token = new URLSearchParams(window.location.search).get('token');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Simulate progress for better UX
        const interval = setInterval(() => {
          setProgress(prev => Math.min(prev + 10, 90));
        }, 300);

        const res = await fetch('/api/auth/verify-magic-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        clearInterval(interval);
        setProgress(100);

        const data = await res.json();

        if (res.ok) {
          localStorage.setItem('sessionToken', data.token);
          setTimeout(() => {
            router.push(`/assinante/${data.userId}`);
          }, 500);
        } else {
          toast.error(data.message || 'Link inválido ou expirado');
          setTimeout(() => router.push('/'), 1500);
        }
      } catch (error) {
        console.error('Verification error:', error);
        toast.error('Erro na verificação');
        setTimeout(() => router.push('/'), 1500);
      }
    };

    if (token) {
      verifyToken();
    } else {
      toast.error('Link inválido');
      setTimeout(() => router.push('/'), 1500);
    }
  }, [token, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verificando seu acesso
          </h1>
          <p className="text-gray-600">
            Estamos validando seu link de acesso
          </p>
        </div>
        
        <Progress value={progress} className="h-2.5" />
        
        <div className="text-center text-sm text-gray-500 mt-4">
          <p>Por favor aguarde, este processo pode levar alguns segundos...</p>
        </div>
      </div>
    </div>
  );
}