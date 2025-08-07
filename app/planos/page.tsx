// /app/planos/page.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { FaCheck, FaCrown } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import CreatePaymentForm from "@/components/CreatePaymentForm";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch"; // Import Switch component

export default function PlansPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLifetime, setIsLifetime] = useState(false);
  
  const userEmail = session?.user?.email;
  const isPremium = false; // You'll need to implement actual premium check

  const toggleBilling = () => setIsLifetime(!isLifetime);

   return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pt-12 px-4 sm:px-6">
        <div className="mb-6 ">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => router.back()}
            className="cursor-pointer"
          >
            ← Voltar
          </Button>
         <p className="mx-auto font-caprasimo caprasimo-regular text-5xl text-[#ff914d] font-bold text-center">
          vaguinhas
        </p>
        </div>
      <div className="max-w-4xl mx-auto">

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Nossos Planos</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Escolha o plano que melhor se adapta às suas necessidades
          </p>

          <div className="flex items-center justify-center mt-6 space-x-4">
            <span className={`font-medium ${!isLifetime ? 'text-yellow-600' : 'text-gray-500'}`}>
              Mensal
            </span>
            <Switch 
              checked={isLifetime}
              onCheckedChange={toggleBilling}
              className="data-[state=checked]:bg-yellow-500 "
            />
            <span className={`font-medium ${isLifetime ? 'text-yellow-600' : 'text-gray-500'}`}>
              Vitalício
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Plano Grátis</h3>
                <div className="flex items-end">
                  <span className="text-4xl font-bold">R$0</span>
                  <span className="text-gray-600 ml-2">/para sempre</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <FaCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span>E-mails semanais com vaguinhas</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span>Até 3 alertas de vagas</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span>Suporte por email</span>
                </li>
              </ul>
              
              <Button 
                className="w-full"
                variant={isPremium ? "outline" : "default"}
                onClick={() => router.push("/")}
              >
                {isPremium ? "Plano Atual" : "Continuar Grátis"}
              </Button>
            </div>
          </div>

          {/* Premium Plan */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-lg overflow-hidden border border-yellow-200 relative">
            <div className="absolute top-4 right-4 bg-[#ff914d] text-white px-3 py-1 rounded-full text-sm font-bold">
              RECOMENDADO
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <h3 className="text-2xl font-bold text-gray-900">Plano Premium</h3>
                  <FaCrown className="ml-2 text-yellow-500" />
                </div>
                
                {/* Dynamic Pricing */}
                {isLifetime ? (
                  <div className="flex flex-col">
                    <div className="flex items-end">
                      <span className="text-4xl font-bold text-gray-900">R$39,79</span>
                      <span className="text-gray-600 ml-2">(único)</span>
                    </div>
                    {/* <div className="mt-1 text-green-600 font-medium">
                      Economize R$349 comparado ao plano mensal
                    </div> */}
                  </div>
                ) : (
                  <div className="flex items-end">
                    <span className="text-4xl font-bold text-gray-900">R$9,79</span>
                    <span className="text-gray-600 ml-2">/mês</span>
                  </div>
                )}
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <FaCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span>
                    <strong>E-mails diários com vaguinhas</strong>
                    {isLifetime && " (vitalício)"}
                  </span>
                </li>
                <li className="flex items-start">
                  <FaCheck className=" text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span>Acesso antecipado a novas features</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span>Suporte prioritário por e-mail e Whatsapp</span>
                </li>
                {/* <li className="flex items-start">
                  <FaCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span>Currículo otimizado por IA</span>
                </li> */}
                
                {/* Lifetime specific benefit */}
                {isLifetime && (
                  <li className="flex items-start bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <FaCheck className="text-[#ff914d] mt-1 mr-2 flex-shrink-0" />
                    <span className="font-medium text-yellow-900">
                      Acesso vitalício sem renovação mensal
                    </span>
                  </li>
                )}
              </ul>
              
              <div className="bg-white rounded-lg p-4 mb-4">
                <CreatePaymentForm 
                  userEmail={userEmail || ""} 
                  buttonText={
                    isPremium 
                      ? "Gerenciar Assinatura" 
                      : isLifetime 
                        ? "Comprar Vitalício" 
                        : "Assinar Premium"
                  }
                //   hideMethodSelect={false}
                  billingType={isLifetime ? "lifetime" : "monthly"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}