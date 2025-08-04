// app/assinante/[id]/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextAuth";
import SubscriberPageClient from "./SubscriberPageClient";
import { PageProps } from "@/.next/types/app/assinante/[id]/page";

export default async function SubscriberPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  console.log('SESSION', session);
  console.log('PARAMS', params);
  
  if (!session) {
    redirect("/");
  }

  const { id: userId } = await params;
  
  // Check if the user is accessing their own page
  if (session.user.id !== userId) {
    redirect("/unauthorized"); // or back to home
  }

  return (
    <>
      <SubscriberPageClient subscriberId={userId} />
      <div className="hidden">
        {/* Force session cookies to be set */}
        <p>Session Token: {session?.user?.id}</p>
      </div>
    </>
  );
}