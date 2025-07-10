'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

export default function OAuthBridge() {
  const { data: session, status } = useSession();
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'authenticated') return;  // wait until we have a session
    if (!session?.user?.email) {
      toast.error('Não foi possível obter seu e‑mail do Google.');
      return;
    }

    // grab your metadata out of the URL
    const stack = params.get('stack')!;
    const seniorityLevel = params.get('seniorityLevel')!;
    const callbackRaw = params.get('callbackUrl') || '/';

    // call your subscribe API
    fetch('/api/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // if your subscribe route also expects the secret header:
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_JWT_SECRET}`,
      },
      body: JSON.stringify({
        email: session.user.email,
        stacks: [stack],
        seniorityLevel
      })
    })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || `Status ${res.status}`);
        }
        return res.json() as Promise<{ id: string }>;
      })
      .then(({ id }) => {
        // finally redirect into the subscriber area
        router.replace(`/assinante/${id}`);
      })
      .catch(err => {
        console.error(err);
        toast.error('Erro ao criar sua conta de assinante.');
        router.replace(callbackRaw); // send them back home (or wherever)
      });
  }, [status, session, params, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p>Carregando…</p>
    </div>
  );
}
