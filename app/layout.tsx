import type { Metadata } from "next";
import { Geist, Geist_Mono, Caprasimo } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Providers from "@/app/Providers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextAuth";
import Image from "next/image";

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
      <head>
        {/* LinkedIn Insight Tag */}
        <Script
          id="linkedin-insight-tag-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window._linkedin_partner_id = "8659825";
              window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
              window._linkedin_data_partner_ids.push(window._linkedin_partner_id);
            `,
          }}
        />
        <Script
          id="linkedin-insight-tag"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(l) {
                if (!l){
                  window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
                  window.lintrk.q=[]
                }
                var s = document.getElementsByTagName("script")[0];
                var b = document.createElement("script");
                b.type = "text/javascript";
                b.async = true;
                b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
                s.parentNode.insertBefore(b, s);
              })(window.lintrk);
            `,
          }}
        />
        <noscript>
          <Image 
            height="1" 
            width="1" 
            style={{display: 'none'}} 
            alt="" 
            src="https://px.ads.linkedin.com/collect/?pid=8659825&fmt=gif" 
          />
        </noscript>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${caprasimo.variable} antialiased`}>
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}