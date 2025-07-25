// app/auth/callback/page.tsx

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const isProcessingRef = useRef(false); // Prevent multiple executions
  const hasProcessedRef = useRef(false); // Track if we've already processed

  const addDebugInfo = (info: string) => {
    console.log(`[OAuth Debug] ${info}`);
    setDebugInfo(prev => [...prev, `${new Date().toISOString()}: ${info}`]);
  };

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Prevent multiple executions
      if (isProcessingRef.current || hasProcessedRef.current) {
        return;
      }

      addDebugInfo(`Status: ${status}, Session exists: ${!!session}`);

      if (status === 'loading') return;

      if (status === 'authenticated' && session?.user) {
        // Mark as processing
        isProcessingRef.current = true;

        try {
          // Check if this is a login attempt (from modal) vs signup (from main page)
          const fromLogin = searchParams.get('fromLogin') === 'true';
          
          // Try multiple methods to get params
          let stack = searchParams.get('stack');
          let seniorityLevel = searchParams.get('seniorityLevel');
          
          addDebugInfo(`URL params - stack: ${stack}, seniorityLevel: ${seniorityLevel}, fromLogin: ${fromLogin}`);
          
          // Method 1: Check state parameter
          const stateParam = searchParams.get('state');
          if (stateParam && !stack && !seniorityLevel) {
            try {
              const decoded = JSON.parse(atob(stateParam));
              stack = decoded.stack;
              seniorityLevel = decoded.seniorityLevel;
              addDebugInfo(`Decoded from state - stack: ${stack}, seniorityLevel: ${seniorityLevel}`);
            } catch (e) {
              addDebugInfo(`Failed to decode state parameter: ${e}`);
            }
          }

          // Method 2: Check cookies
          if (!stack || !seniorityLevel) {
            const getCookie = (name: string) => {
              const value = `; ${document.cookie}`;
              const parts = value.split(`; ${name}=`);
              if (parts.length === 2) {
                const cookieValue = parts.pop()?.split(';').shift();
                return cookieValue ? decodeURIComponent(cookieValue) : null;
              }
              return null;
            };

            const cookieData = getCookie('oauth_params');
            if (cookieData) {
              try {
                const parsed = JSON.parse(cookieData);
                stack = stack || parsed.stack;
                seniorityLevel = seniorityLevel || parsed.seniorityLevel;
                addDebugInfo(`From cookie - stack: ${stack}, seniorityLevel: ${seniorityLevel}`);
                
                // Clear the cookie
                document.cookie = 'oauth_params=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
              } catch (e) {
                addDebugInfo(`Failed to parse cookie data: ${e}`);
              }
            }
          }

          // Method 3: Check sessionStorage
          if (!stack || !seniorityLevel) {
            const storedParams = sessionStorage.getItem('oauth_params');
            if (storedParams) {
              try {
                const parsed = JSON.parse(storedParams);
                // Validate timestamp to ensure params are recent (within 10 minutes)
                if (parsed.timestamp && Date.now() - parsed.timestamp < 600000) {
                  stack = stack || parsed.stack;
                  seniorityLevel = seniorityLevel || parsed.seniorityLevel;
                  addDebugInfo(`From sessionStorage - stack: ${stack}, seniorityLevel: ${seniorityLevel}`);
                } else {
                  addDebugInfo('SessionStorage params are too old, ignoring');
                }
              } catch (e) {
                addDebugInfo(`Failed to parse sessionStorage: ${e}`);
              }
            }
          }

          // If this is a login attempt and we don't have stack/seniority, check if user exists
          if (fromLogin && (!stack || !seniorityLevel)) {
            addDebugInfo('Login attempt - checking if user exists in database');
            
            try {
              // Check if user exists in database
              const checkResponse = await fetch('/api/users/check-exists', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${process.env.NEXT_PUBLIC_JWT_SECRET}`,
                },
                body: JSON.stringify({ email: session.user.email }),
              });

              const checkData = await checkResponse.json();
              
              if (checkData.exists && checkData.user) {
                // User exists, redirect to their subscriber area
                addDebugInfo('User exists, redirecting to subscriber area');
                router.push(`/assinante/${checkData.user._id}`);
                return;
              } else {
                // User doesn't exist, they need to sign up first
                addDebugInfo('User does not exist in database');
                toast.error('Por favor, cadastre-se primeiro selecionando sua área e nível profissional');
                router.push('/');
                return;
              }
            } catch (error) {
              addDebugInfo(`Error checking user existence: ${error}`);
              toast.error('Erro ao verificar usuário');
              router.push('/');
              return;
            }
          }

          // For signup flow, we need stack and seniority
          if (!fromLogin && (!stack || !seniorityLevel)) {
            addDebugInfo('Missing required information after all attempts');
            toast.error('Missing required information. Please try signing up again.');
            
            // Show debug info in development
            if (process.env.NODE_ENV === 'development') {
              console.log('Debug information:', debugInfo);
            }
            
            // Mark as processed even on error
            hasProcessedRef.current = true;
            router.push('/');
            return;
          }

          // Only update user profile if we have stack and seniority (signup flow)
          if (stack && seniorityLevel) {
            addDebugInfo(`Updating user with stack: ${stack}, seniorityLevel: ${seniorityLevel}`);

          // Log session user for debugging
          console.log('SESSION USER', session.user);

          // Use the dedicated OAuth update endpoint
          const updateResponse = await fetch('/api/users/oauth-update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_JWT_SECRET}`,
            },
            body: JSON.stringify({
              email: session.user.email,
              stack,
              seniorityLevel,
              provider: session.user.provider || session.user.provider || 'oauth',
              providerId: session.user.id,
              // Only include values that exist
              ...(session.user.profile?.headline && { headline: session.user.profile.headline }),
              ...(session.user.profile?.industry && { industry: session.user.profile.industry }),
              ...(session.user.profile?.location && { location: session.user.profile.location }),
              ...(session.user.profile?.profileUrl && { profileUrl: session.user.profile.profileUrl }),
              ...(session.user.profile?.givenName && { givenName: session.user.profile.givenName }),
              ...(session.user.profile?.familyName && { familyName: session.user.profile.familyName }),
              ...(session.user.profile?.emailType && { emailType: session.user.profile.emailType }),
            }),
          });

          const responseText = await updateResponse.text();
          addDebugInfo(`Update response status: ${updateResponse.status}, body: ${responseText}`);

          if (!updateResponse.ok) {
            let errorData;
            try {
              errorData = JSON.parse(responseText);
            } catch {
              errorData = { message: responseText };
            }
            throw new Error(errorData.message || 'Failed to update user profile');
          }

          const userData = JSON.parse(responseText);
          addDebugInfo(`User data received: ${JSON.stringify(userData)}`);

            // Clear all stored params
            sessionStorage.removeItem('oauth_params');
            
            // Mark as successfully processed
            hasProcessedRef.current = true;

            // Show success message
            toast.success(userData.isNewUser ? 'Conta criada com sucesso!' : 'Login realizado com sucesso!');

            // Redirect to subscriber area
            if (userData.userId) {
              router.push(`/assinante/${userData.userId}`);
            } else {
              throw new Error('No userId received from server');
            }
          }
        } catch (error) {
          addDebugInfo(`Error: ${error}`);
          console.error('OAuth callback error:', error);
          console.log('Debug trace:', debugInfo);
          
          toast.error(`Erro ao completar o login: ${error instanceof Error ? error.message : 'Unknown error'}`);
          
          // Mark as processed even on error
          hasProcessedRef.current = true;
          router.push('/');
        } finally {
          // Reset processing flag
          isProcessingRef.current = false;
        }
      } else if (status === 'unauthenticated') {
        addDebugInfo('User is unauthenticated');
        toast.error('Falha na autenticação. Por favor, tente novamente.');
        hasProcessedRef.current = true;
        router.push('/');
      }
    };

    handleOAuthCallback();
  }, [status, session, searchParams, router]); // Remove debugInfo from dependencies

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Processando login...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        
        {/* Show debug info in development */}
        {process.env.NODE_ENV === 'development' && debugInfo.length > 0 && (
          <div className="mt-8 text-left max-w-2xl mx-auto p-4 bg-gray-100 rounded">
            <h3 className="font-bold mb-2">Debug Info:</h3>
            <ul className="text-xs space-y-1 max-h-96 overflow-y-auto">
              {debugInfo.map((info, index) => (
                <li key={index} className="font-mono">{info}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}