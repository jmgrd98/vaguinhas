'use client';

import { useState } from 'react';

export default function UnsubscribeSuccess() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResubscribe = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Obter o email da URL (se estiver disponível)
      const params = new URLSearchParams(window.location.search);
      const email = params.get('email');

      if (!email) {
        throw new Error('Email não encontrado na URL');
      }

      // Chamar a rota de inscrição
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao reativar inscrição');
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col gap-10 items-center justify-center bg-gray-50 px-4">
      <p
          className={`font-caprasimo caprasimo-regular text-6xl sm:text-8xl text-[#ff914d] font-bold text-center`}
        >
          vaguinhas
        </p>
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <div className="mb-6">
          <div className="bg-green-100 rounded-full p-3 inline-flex">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Inscrição cancelada com sucesso!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Você não receberá mais nossos e-mails com as vagas diárias.
        </p>
        
        <div className="border-t pt-6">
          <p className="text-gray-600 mb-4">
            Caso tenha sido um engano, você pode se inscrever novamente:
          </p>
          
          {isSuccess ? (
            <div className="bg-green-100 text-green-700 py-2 px-4 rounded-md">
              Inscrição reativada com sucesso!
            </div>
          ) : (
            <button
              onClick={handleResubscribe}
              disabled={isLoading}
              className={`inline-block bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Processando...' : 'Reativar Inscrição'}
            </button>
          )}
          
          {error && (
            <div className="mt-4 bg-red-100 text-red-700 py-2 px-4 rounded-md">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}