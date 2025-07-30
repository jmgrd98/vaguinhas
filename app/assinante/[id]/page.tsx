// app/assinante/[id]/page.tsx
import { redirect } from "next/navigation";
import SubscriberPageClient from "./SubscriberPageClient";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function SubscriberPage({ params }: PageProps) {
  const userId = params.id;
  
  if (!userId) {
    redirect("/");
  }

  return <SubscriberPageClient subscriberId={userId} />;
}