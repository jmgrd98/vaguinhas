import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FaMagic } from "react-icons/fa";


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
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const [useMagicLink, setUseMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const validateEmail = useCallback((emailToValidate: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailToValidate);
  }, []);

  const handleSendMagicLink = useCallback(async () => {
    if (!validateEmail(accessEmail)) {
      toast.error("Por favor, insira um e-mail válido");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: accessEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        setMagicLinkSent(true);
        toast.success("Link mágico enviado! Verifique seu e-mail.");
      } else {
        toast.error(data.message || "Erro ao enviar link de acesso");
      }
    } catch (error) {
      console.error('Magic link error:', error);
      toast.error("Erro ao enviar link de acesso");
    } finally {
      setIsLoading(false);
    }
  }, [accessEmail, validateEmail]);

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
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_JWT_SECRET}`,
         },
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

  const handlePasswordReset = useCallback(async () => {
    if (!validateEmail(resetEmail)) {
      toast.error("Por favor, insira um e-mail válido");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      if (res.ok) {
        toast.success("E-mail de redefinição enviado! Verifique sua caixa de entrada.");
        setShowResetForm(false);
        setResetEmail("");
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Falha ao enviar e-mail de redefinição");
      }
    } catch (error: unknown) {
      console.error('Error:', error);
      toast.error("Erro ao processar pedido de redefinição de senha");
    } finally {
      setIsLoading(false);
    }
  }, [resetEmail, validateEmail]);

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
            {showResetForm ? (
              <>
                <h2 className="text-xl font-bold mb-4">Redefinir Senha</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Insira seu e-mail para receber instruções de redefinição de senha
                </p>
                
                <Input
                  type="email"
                  placeholder="Insira seu e-mail cadastrado"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full mb-4"
                />
                
                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    className="cursor-pointer"
                    variant="outline"
                    onClick={() => {
                      setShowResetForm(false);
                      setResetEmail("");
                    }}
                    disabled={isLoading}
                  >
                    Voltar
                  </Button>
                  <Button
                    className="cursor-pointer"
                    variant="default"
                    onClick={handlePasswordReset}
                    disabled={isLoading || !validateEmail(resetEmail)}
                  >
                    {isLoading ? "Enviando..." : "Enviar instruções"}
                  </Button>
                </div>
              </>
            ) : (
              <>
              <h2 className="text-xl font-bold mb-4">Acessar Área do Assinante</h2>
              
              <div className="space-y-4">
                <Input
                  type="email"
                  placeholder="Insira seu e-mail cadastrado"
                  value={accessEmail}
                  onChange={(e) => setAccessEmail(e.target.value)}
                  className="w-full"
                />
                
                {/* Conditional rendering based on login method */}
                {!useMagicLink ? (
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
                ) : magicLinkSent ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <FaMagic className="mx-auto text-blue-500 text-2xl mb-2" />
                    <p className="text-blue-700">
                      Link enviado para <span className="font-semibold">{accessEmail}</span>
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      Verifique sua caixa de entrada e spam
                    </p>
                  </div>
                ) : null}
              </div>
              
              <div className="flex flex-col gap-3 mt-6">
                {/* Magic Link / Password toggle */}
                {!magicLinkSent && (
                  <button
                    onClick={() => setUseMagicLink(!useMagicLink)}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center"
                  >
                    {useMagicLink 
                      ? "Acessar com senha" 
                      : "Acessar com link mágico"}
                    <FaMagic className="ml-2" />
                  </button>
                )}
                
                <div className="flex justify-between items-center">
                  {!useMagicLink && (
                    <button
                      onClick={() => setShowResetForm(true)}
                      className="text-sm text-gray-600 hover:text-blue-600"
                    >
                      Esqueceu sua senha?
                    </button>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={onClose}
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                    
                    <Button
                      variant="default"
                      onClick={
                        useMagicLink ? handleSendMagicLink : handleSubscriberAccess
                      }
                      disabled={
                        isLoading || 
                        !accessEmail || 
                        (!useMagicLink && !accessPassword)
                      }
                    >
                      {isLoading 
                        ? "Carregando..." 
                        : useMagicLink ? "Enviar Link" : "Acessar"}
                    </Button>
                  </div>
                </div>
              </div>
            </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}