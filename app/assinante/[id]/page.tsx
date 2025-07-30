// app/assinante/[id]/page.tsx
import { redirect } from "next/navigation";
import SubscriberPageClient from "./SubscriberPageClient";
import { PageProps } from "@/.next/types/app/assinante/[id]/page";
export default async function SubscriberPage({ params }: PageProps) {
  const { id: userId} = await params;
  
  if (!userId) {
    redirect("/");
  }

  return <SubscriberPageClient subscriberId={userId} />;
}