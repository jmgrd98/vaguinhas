import type { Metadata } from "next";
import { Geist, Geist_Mono, Caprasimo } from "next/font/google";
import "./globals.css";
import Providers from "@/app/Providers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextAuth";
import { LinkedInInsightTag } from 'nextjs-linkedin-insight-tag';

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
  description: "Recebe vagas personalizadas de tecnologia diariamente no seu e-mail.",
  icons: {
    icon: '/favicon.ico'
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${caprasimo.variable} antialiased`}>
        <Providers session={session}>
          {children}
        </Providers>

        <LinkedInInsightTag partnerId={process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID} />
      </body>
    </html>
  );
}