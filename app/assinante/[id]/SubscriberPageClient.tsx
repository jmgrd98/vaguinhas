"use client";

import { useState, useEffect } from "react";
import { 
  redirect,
  useRouter 
} from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { FaSignOutAlt } from "react-icons/fa";
import { useCompleteLogout } from "@/hooks/useCompleteLogout";
import { useSession } from "next-auth/react";

interface UserData {
  _id: string;
  email: string;
  seniorityLevel: string;
  stacks?: string[];
  confirmed: boolean;
  createdAt: string;
  subscriberId: string;
}

interface SubscriberPageProps {
  subscriberId: string;
}

export default function SubscriberPageClient({
  subscriberId
}: SubscriberPageProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { logout, isLoggingOut } = useCompleteLogout();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [formData, setFormData] = useState({
    seniorityLevel: "",
    stacks: [] as string[],
  });

  // Prevent browser back button cache
  useEffect(() => {
    console.log('SESSION', session);
    console.log('SESSION STATUS', status);
    window.history.pushState(null, '', window.location.pathname);
    
    const handlePopState = () => {
      if (status === 'unauthenticated') {
        router.replace('/');
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [status, router, session]);

  if (!subscriberId) {
    redirect("/");
  }

  useEffect(() => {
    async function fetchUserData() {
      // Wait for session to be ready
      if (status === 'loading') {
        console.log('Session still loading, waiting...');
        return;
      }

      // If unauthenticated, redirect
      if (status === 'unauthenticated') {
        console.log('User is unauthenticated, redirecting...');
        router.replace('/');
        return;
      }

      try {
        setLoading(true);
        setFetchError(null);
        
        // Add a small delay on first attempt to ensure session is propagated
        if (retryCount === 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log(`Fetching user data for ${subscriberId}, attempt ${retryCount + 1}`);
        
        const res = await fetch(`/api/users/${subscriberId}`, {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json',
            // If you're using a bearer token, include it
            ...(session?.user?.id ? {
              'X-User-Id': session.user.id
            } : {})
          }
        });
        
        console.log('Fetch response status:', res.status);
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
          console.error('Fetch error:', errorData);
          
          // If it's a 404 or 401, retry once after a delay
          if ((res.status === 404 || res.status === 401) && retryCount < 2) {
            console.log('Retrying fetch after delay...');
            setRetryCount(prev => prev + 1);
            setTimeout(() => {
              fetchUserData();
            }, 1000);
            return;
          }
          
          throw new Error(errorData.message || "Falha ao carregar dados");
        }
        
        const data: UserData = await res.json();
        console.log('User data loaded successfully:', data.email);
        
        setUserData(data);
        setFormData({
          seniorityLevel: data.seniorityLevel || "",
          stacks: data.stacks || [],
        });
        setFetchError(null);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        setFetchError(error instanceof Error ? error.message : "Falha ao carregar suas informações");
        
        // Retry logic for network errors
        if (retryCount < 2) {
          console.log('Network error, retrying...');
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            fetchUserData();
          }, 2000);
        } else {
          toast.error("Falha ao carregar suas informações após múltiplas tentativas");
        }
      } finally {
        setLoading(false);
      }
    }
    
    // Only fetch when we have a valid session
    if (status === 'authenticated' || (status === 'unauthenticated' && retryCount < 1)) {
      fetchUserData();
    }
  }, [subscriberId, status, session, retryCount, router]);

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      const res = await fetch(`/api/users/${subscriberId}`, {
        method: "PUT",
        credentials: 'include',
        headers: { 
          "Content-Type": "application/json",
          // Include session info if available
          ...(session?.user?.id ? {
            'X-User-Id': session.user.id
          } : {})
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Falha na atualização");
      }
      
      toast.success("Preferências atualizadas com sucesso!");
      setUserData({ ...userData!, ...formData });
    } catch (error) {
      console.error("Erro na atualização:", error);
      toast.error("Falha ao atualizar suas informações");
    } finally {
      setUpdating(false);
    }
  };

  // Show loading state while session is loading or data is being fetched
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <p className="text-center text-gray-500 mt-4">
            {status === 'loading' ? 'Verificando sessão...' : 'Carregando dados...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (!userData && fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            {fetchError === "Falha ao carregar dados" ? "Usuário não encontrado" : "Erro ao carregar dados"}
          </h1>
          <p className="text-gray-600 mb-4">{fetchError}</p>
          <div className="space-x-2">
            <Button 
              className="cursor-pointer" 
              onClick={() => {
                setRetryCount(0);
                window.location.reload();
              }}
            >
              Tentar Novamente
            </Button>
            <Button 
              variant="outline"
              className="cursor-pointer" 
              onClick={logout}
              disabled={isLoggingOut}
            >
              <FaSignOutAlt className="mr-2" />
              {isLoggingOut ? "Saindo..." : "Sair"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading if no data yet (shouldn't reach here often)
  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-8">
      <div className="relative w-full mb-8 flex items-center">
        <Button
          variant="outline"
          className="absolute left-0 cursor-pointer"
          onClick={logout}
          disabled={isLoggingOut}
        >
          <FaSignOutAlt className="mr-2" /> 
          {isLoggingOut ? "Saindo..." : "Sair"}
        </Button>
        <p className="mx-auto font-caprasimo caprasimo-regular text-5xl text-[#ff914d] font-bold text-center">
          vaguinhas
        </p>
      </div>

      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Painel de Assinante</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Gerencie suas preferências e informações da conta
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-xl font-semibold mb-2">Informações da Conta</h2>
            <div className="space-y-2">
              <p>
                <span className="font-medium">E-mail:</span> {userData.email}
              </p>
              <p>
                <span className="font-medium">Membro desde:</span>{' '}
                {new Date(userData.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <h2 className="text-xl font-bold mb-6">Atualizar Preferências</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Senioridade</label>
              <Select
                value={formData.seniorityLevel}
                onValueChange={(value) =>
                  setFormData({ ...formData, seniorityLevel: value })
                }
              >
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">Júnior</SelectItem>
                  <SelectItem value="pleno">Pleno</SelectItem>
                  <SelectItem value="senior">Sênior</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Área</label>
              <Select
                value={formData.stacks[0] || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, stacks: [value] })
                }
                required
              >
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder="Selecione sua área" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    'frontend',
                    'backend',
                    'mobile',
                    'fullstack',
                    'dados',
                    'design'
                  ].map(area => (
                    <SelectItem key={area} value={area}>
                      {area === 'design' ? 'Designer UI/UX' : area.charAt(0).toUpperCase() + area.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleUpdate}
              disabled={updating}
              className="w-full sm:w-auto cursor-pointer"
            >
              {updating ? "Atualizando…" : "Salvar alterações"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}