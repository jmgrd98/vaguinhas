import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FaEye, FaEyeSlash } from "react-icons/fa";

interface SubscriberAreaLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  resendConfirmation: (email: string) => Promise<void>;
}

export default function SubscriberAreaLoginModal({ 
  isOpen, 
  onClose,
  resendConfirmation
}: SubscriberAreaLoginModalProps) {
  const router = useRouter();
  const [accessEmail, setAccessEmail] = useState("");
  const [accessPassword, setAccessPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = useCallback((emailToValidate: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailToValidate);
  }, []);

  const handleSubscriberAccess = useCallback(async () => {
    if (!validateEmail(accessEmail)) {
      toast.error("Por favor, insira um e-mail válido");
      return;
    }

    if (!accessPassword) {
      toast.error("Por favor, insira sua senha");
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: accessEmail, 
          password: accessPassword  
        }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('sessionToken', data.token);
        router.push(`/assinante/${data.userId}`);
        onClose();
      } 
      else if (res.status === 401) {
        toast.error("Credenciais inválidas");
      } 
      else if (res.status === 403) {
        toast.error("Esse e-mail ainda não foi confirmado", {
          action: {
            label: "Reenviar Confirmação",
            onClick: () => resendConfirmation(accessEmail)
          },
        });
      } 
      else if (res.status === 404) {
        toast.error("E-mail não encontrado. Por favor, verifique ou cadastre-se.");
      } 
      else {
        const errorData = await res.json();
        toast.error(errorData.message || "Erro ao acessar área do assinante");
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Erro ao acessar área do assinante");
    } finally {
      setIsLoading(false);
    }
  }, [accessEmail, accessPassword, router, resendConfirmation, onClose, validateEmail]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl"
          >
            <h2 className="text-xl font-bold mb-4">Acessar Área do Assinante</h2>
            
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="Insira seu e-mail cadastrado"
                value={accessEmail}
                onChange={(e) => setAccessEmail(e.target.value)}
                className="w-full"
              />
              <div className="relative w-full">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Insira sua senha"
                  value={accessPassword}
                  onChange={(e) => setAccessPassword(e.target.value)}
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                variant="default"
                onClick={handleSubscriberAccess}
                disabled={isLoading || !accessEmail || !accessPassword}
                className="cursor-pointer"
              >
                {isLoading ? "Carregando..." : "Acessar"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
