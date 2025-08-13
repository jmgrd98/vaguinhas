// app/verify-magic-link/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

export default function MagicLinkVerification() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [progress, setProgress] = useState(0);
  const { data: session, status, update } = useSession(); // Get update method

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        toast.error('Link inválido');
        setTimeout(() => router.push('/'), 1500);
        return;
      }

      try {
        const interval = setInterval(() => {
          setProgress(prev => Math.min(prev + 10, 90));
        }, 300);

        const result = await signIn('magic-link', {
          token,
          redirect: false,
        });

        clearInterval(interval);
        setProgress(100);

        if (result?.error) {
          throw new Error(result.error);
        }

        if (result?.ok) {
          // Force immediate session update
          const updatedSession = await update();
          
          // Redirect directly after session update
          if (updatedSession?.user?.id) {
            router.push(`/assinante/${updatedSession.user.id}`);
          } else {
            throw new Error('Session update failed');
          }
        }
      } catch (error) {
        console.error('Verification error:', error);
        toast.error('Link inválido ou expirado');
        setTimeout(() => router.push('/'), 1500);
      }
    };

    verifyToken();
  }, [token, router, update]); // Add update to dependencies

  // Watch for session changes after sign in
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      // Redirect to the user's specific page
      router.push(`/assinante/${session.user.id}`);
    }
  }, [session, status, router]);

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