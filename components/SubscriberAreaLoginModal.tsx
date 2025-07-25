import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaEye,
  FaEyeSlash,
  FaGoogle,
  // FaLinkedin 
} from "react-icons/fa";
import { signIn } from "next-auth/react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface SubscriberAreaLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  resendConfirmation: (email: string) => Promise<void>;
  onLoginSuccess?: (userId: string) => void;
}

export default function SubscriberAreaLoginModal({ 
  isOpen, 
  onClose,
  resendConfirmation,
  onLoginSuccess
}: SubscriberAreaLoginModalProps) {
  const [accessEmail, setAccessEmail] = useState("");
  const [accessPassword, setAccessPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  
  // Add state for OAuth login requirements
  const [oauthStack, setOauthStack] = useState("");
  const [oauthSeniority, setOauthSeniority] = useState("");
  const [showOauthError, setShowOauthError] = useState(false);

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
        
        if (onLoginSuccess) {
          onLoginSuccess(data.userId);
        }
        
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
  }, [accessEmail, accessPassword, resendConfirmation, onClose, validateEmail, onLoginSuccess]);

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

  const handleGoogleSignIn = useCallback(() => {
    // Check if stack and seniority are selected
    if (!oauthStack || !oauthSeniority) {
      setShowOauthError(true);
      return;
    }
    setShowOauthError(false);

    // Store params in sessionStorage for OAuth flow
    sessionStorage.setItem('oauth_params', JSON.stringify({ 
      stack: oauthStack, 
      seniorityLevel: oauthSeniority 
    }));

    // Build callback URL with params
    const cb = `${window.location.origin}/auth/callback`
            + `?stack=${encodeURIComponent(oauthStack)}`
            + `&seniorityLevel=${encodeURIComponent(oauthSeniority)}`;

    signIn("google", { 
      callbackUrl: cb,
      redirect: true 
    });
  }, [oauthStack, oauthSeniority]);

  // Reset OAuth fields when modal closes
  useCallback(() => {
    if (!isOpen) {
      setOauthStack("");
      setOauthSeniority("");
      setShowOauthError(false);
    }
  }, [isOpen]);

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

                {/* OAuth Sign-in Options */}
                <div className="mt-6 space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-gray-800 px-2 text-gray-500">
                        Ou continue com
                      </span>
                    </div>
                  </div>

                  {/* Stack and Seniority selection for OAuth */}
                  <div className="space-y-3">
                    <Select value={oauthStack} onValueChange={setOauthStack}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione sua área" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          'frontend',
                          'backend',
                          'fullstack',
                          'mobile',
                          'dados',
                          'design'
                        ].map(area => (
                          <SelectItem key={area} value={area}>
                            {area === 'design' ? 'Designer UI/UX' : area.charAt(0).toUpperCase() + area.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={oauthSeniority} onValueChange={setOauthSeniority}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione seu nível profissional" />
                      </SelectTrigger>
                      <SelectContent>
                        {["junior", "pleno", "senior"].map(level => (
                          <SelectItem key={level} value={level}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {showOauthError && (
                      <p className="text-red-500 text-sm text-center">
                        Por favor, selecione sua área e nível profissional antes de continuar com Google.
                      </p>
                    )}

                    <Button
                      variant="outline"
                      className="w-full cursor-pointer"
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                    >
                      <FaGoogle className="mr-2" /> Google
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-center mt-6">
                   <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowResetForm(true)}
                    className="text-[12px] mt-2 justify-start w-1/2 text-black hover:text-blue-500 hover:bg-transparent cursor-pointer"
                  >
                    Esqueceu a sua senha?
                  </Button>

                  <div className="flex gap-2">
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
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}