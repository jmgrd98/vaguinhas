// app/assinante/[id]/page.tsx
import { redirect } from "next/navigation";
import SubscriberPageClient from "./SubscriberPageClient";

export default async function SubscriberPage({ params }: { params: { id: string } }) {
  const userId = params.id;
  
  if (!userId) {
    redirect("/");
  }

  return <SubscriberPageClient subscriberId={userId} />;
}