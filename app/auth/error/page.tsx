// app/auth/error/page.tsx (for App Router)
// or pages/auth/error.tsx (for Pages Router)

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  // Parse provider mismatch errors
  const isProviderMismatch = error?.includes('PROVIDER_MISMATCH');
  const originalProvider = isProviderMismatch 
    ? error?.split(':')[1] 
    : null;

  const getErrorMessage = () => {
    if (isProviderMismatch && originalProvider) {
      const providerName = originalProvider.charAt(0).toUpperCase() + originalProvider.slice(1);
      return {
        title: 'Account Already Exists',
        message: `This email address is already registered with ${providerName}. Please sign in using ${providerName} instead.`,
        showProviderButton: true,
        provider: originalProvider
      };
    }

    if (error === 'USER_NOT_FOUND') {
      return {
        title: 'Account Not Found',
        message: 'This email address is not registered yet. Please sign up first by selecting your stack and seniority level on the main page.',
        showProviderButton: false,
        provider: null,
        showSignupButton: true
      };
    }

    // Default error message
    return {
      title: 'Authentication Error',
      message: 'An error occurred during authentication. Please try again.',
      showProviderButton: false,
      provider: null
    };
  };

  const { title, message, showProviderButton, provider, showSignupButton } = getErrorMessage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          
          <div className="space-y-3">
            {showProviderButton && provider && (
              <Link
                href={`/api/auth/signin/${provider}`}
                className={`w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white ${
                  provider === 'google' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-blue-800 hover:bg-blue-900'
                }`}
              >
                Sign in with {provider.charAt(0).toUpperCase() + provider.slice(1)}
              </Link>
            )}

            {showSignupButton && (
              <Link
                href="/"
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
              >
                Go to Sign Up
              </Link>
            )}
            
            <Link
              href="/"
              className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}