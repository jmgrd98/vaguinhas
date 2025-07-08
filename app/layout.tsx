import type { Metadata } from "next";
import { Geist, Geist_Mono, Caprasimo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const caprasimo = Caprasimo({
  weight: "400",
  variable: "--font-caprasimo",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "vaguinhas",
  description: "Receba vagas de tecnologia diariamente no seu e-mail.",
  icons: {
    icon: '/favicon.ico'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${caprasimo.variable} antialiased`}
        >
          {children}
          <Toaster 
            closeButton
            duration={5000}
            position="bottom-right"
            richColors
            toastOptions={{
              // Default options
              duration: 5000,
              style: {
                borderRadius: '8px',
                background: '#1a202c',    // dark gray
                color: '#edf2f7',         // light gray
                padding: '16px',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
              }
          }}
          />
        </body>
    </html>
  );
}
