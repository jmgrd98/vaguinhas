import { Suspense } from 'react';
import ConfirmEmailClient from '@/components/ConfirmEmailClient'
import { Loader2 } from 'lucide-react';

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    }>
      <ConfirmEmailClient />
    </Suspense>
  );
}
