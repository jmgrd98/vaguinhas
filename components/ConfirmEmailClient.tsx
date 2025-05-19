'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function ConfirmEmailClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        if (!token) {
          throw new Error('Token não encontrado');
        }

        const res = await fetch(`/api/confirm-email?token=${token}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Erro na confirmação');
        }

        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    confirmEmail();
  }, [token]);

  const handleResend = async () => {
    try {
      setLoading(true);
      const email = localStorage.getItem('confirmationEmail');
      if (!email) throw new Error('E-mail não encontrado');

      const res = await fetch('/api/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error('Falha ao reenviar');
      setError(null);
      setLoading(false);
      alert('E-mail de confirmação reenviado com sucesso!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reenviar');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
          <h1 className="mt-4 text-2xl font-bold">Confirmando seu e-mail...</h1>
          <p className="mt-2 text-gray-600">Por favor aguarde</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Alert variant={success ? 'default' : 'destructive'} className="text-center">
          {success ? (
            <CheckCircle2 className="h-6 w-6 mx-auto" />
          ) : (
            <XCircle className="h-6 w-6 mx-auto" />
          )}
          <AlertTitle className="mt-4 text-xl font-bold">
            {success ? 'Confirmação bem-sucedida!' : 'Erro na confirmação'}
          </AlertTitle>
          <AlertDescription className="mt-4">
            {success ? (
              <>
                <p>Seu e-mail foi confirmado com sucesso!</p>
                <Button
                  className="mt-4"
                  onClick={() => window.location.href = '/'}
                >
                  Ir para a página inicial
                </Button>
              </>
            ) : (
              <>
                <p>{error}</p>
                <Button
                  className="mt-4"
                  onClick={handleResend}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    'Reenviar e-mail de confirmação'
                  )}
                </Button>
              </>
            )}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}