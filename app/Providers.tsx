'use client'

import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { useLogoutSync } from "@/hooks/useLogoutSync";

export default function Providers({
  children,
  session
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  useLogoutSync();
  return (
    <SessionProvider session={session}>
      {children}
      <Toaster 
        closeButton
        duration={5000}
        position="bottom-right"
        richColors
        toastOptions={{
          duration: 5000,
          style: {
            borderRadius: '8px',
            background: '#1a202c',
            color: '#edf2f7',
            padding: '16px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
          }
        }}
      />
    </SessionProvider>
  );
}