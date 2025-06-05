import { Suspense } from 'react';
import ConfirmEmailClient from '@/components/ConfirmEmailClient'
import { Loader2 } from 'lucide-react';

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div>
        <p
          className={`font-caprasimo caprasimo-regular text-6xl sm:text-8xl text-[#ff914d] font-bold text-center`}
        >
          vaguinhas
        </p>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        </div>
      </div>
    }>
      <ConfirmEmailClient />
    </Suspense>
  );
}