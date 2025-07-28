// app/not-found.tsx
'use client'
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 text-center">
        <p className={`font-caprasimo caprasimo-regular text-6xl sm:text-8xl text-[#ff914d] font-bold text-center`}>
                vaguinhas
            </p>
        {/* 404 Icon/Illustration */}
        <div className="mb-8">
          <svg
            className="mx-auto h-24 w-24 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        

        {/* Error Message */}
        <div className="space-y-3">
          <h1 className="text-9xl font-extrabold text-gray-900">404</h1>
          <h2 className="text-3xl font-bold text-gray-900">Ops...</h2>
          <p className="text-gray-600 max-w-sm mx-auto">
            Desculpe, não encontramos a página que você está procurando.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 space-y-3">
          <Link
            href="/"
            className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Ir para a página inicial
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="w-full flex justify-center items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Voltar
          </button>
        </div>


      </div>
    </div>
  );
}