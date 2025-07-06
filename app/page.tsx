"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import { z } from "zod";
import { FaWhatsapp, FaGithub } from "react-icons/fa";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import Link from "next/link";
import Confetti from "react-confetti";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import SubscriberAreaLoginModal from "@/components/SubscriberAreaLoginModal";

const emailSchema = z.string().email("E-mail inválido").toLowerCase();

// Custom hooks
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
};

const useCooldown = (initialCooldown = 0) => {
  const [cooldown, setCooldown] = useState(initialCooldown);
  const [canResend, setCanResend] = useState(initialCooldown === 0);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [cooldown]);

  return { cooldown, setCooldown, canResend, setCanResend };
};

export default function Home() {

  const windowSize = useWindowSize();
  const { cooldown, setCooldown, canResend, setCanResend } = useCooldown(0);
  
  // Form states
  const [email, setEmail] = useState("");
  const [seniorityLevel, setSeniorityLevel] = useState("");
  const [stack, setStack] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Email validation
  const validateEmail = useCallback((emailToValidate: string): boolean => {
    return emailSchema.safeParse(emailToValidate).success;
  }, []);

  useEffect(() => {
    if (!email) {
      setValidationError(null);
      return;
    }
    setValidationError(validateEmail(email) ? null : "E-mail inválido");
  }, [email, validateEmail]);

  // Confetti effect
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  // Form submission
  const saveEmail = useCallback(async () => {
    if (!validateEmail(email)) {
      setValidationError("E-mail inválido");
      return;
    }
    setStatus("loading");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_JWT_SECRET}`,
        },
        body: JSON.stringify({ email, seniorityLevel, stacks: [stack] }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `HTTP error! Status: ${res.status}`);
      }

      if (res.status === 201) {
        localStorage.setItem("confirmationEmail", email);
        localStorage.setItem("lastResend", Date.now().toString());
        
        setCooldown(60);
        setCanResend(false);
        setStatus("success");
        setShowConfetti(true);
        setEmail("");
        setSeniorityLevel("");
        setStack("");

        // Schedule follow-up emails
        const scheduleEmail = async (endpoint: string, delay: number) => {
          setTimeout(async () => {
            try {
              await fetch(endpoint, {
                method: "POST",
                headers: { 
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${process.env.NEXT_PUBLIC_JWT_SECRET}`,
                 },
                body: JSON.stringify({ email })
              });
            } catch (err) {
              console.error(`Error sending ${endpoint}:`, err);
            }
          }, delay);
        };

        scheduleEmail("/api/emails/send-favourite-on-github-email", 120_000);
        scheduleEmail("/api/emails/send-feedback-email", 600_000);
      } 
      else if (res.status === 409) {
        toast.warning("Esse e-mail já está cadastrado!", {
          description: "Obrigado, seu e-mail já foi validado.",
        });
      }
      else {
        throw new Error("Unexpected response status");
      }
    } catch (err: unknown) {
      setStatus("error");
      toast.error(err instanceof Error ? `Error: ${err.message}` : "Unknown error occurred");
    }
  }, [email, seniorityLevel, stack, validateEmail, setCooldown, setCanResend]);

  // Resend confirmation
  const resendConfirmation = useCallback(async (emailToResend: string) => {
    try {
      const now = Date.now();
      const lastResend = localStorage.getItem("lastResend");
      
      if (lastResend && now - Number(lastResend) < 60000) {
        toast.warning("Aguarde 1 minuto para reenviar o e-mail de confirmação");
        return;
      }

      const res = await fetch("/api/emails/resend-confirmation", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_JWT_SECRET}`,
         },
        body: JSON.stringify({ email: emailToResend }),
      });

      if (res.status === 409) {
        toast.warning("Esse e-mail já está confirmado!", {
          description: "Obrigado, seu e-mail já foi validado.",
        });
        return;
      }

      if (!res.ok) throw new Error();

      localStorage.setItem("lastResend", now.toString());
      setCooldown(60);
      setCanResend(false);
      toast.success("E-mail de confirmação reenviado!");
    } catch {
      toast.error("Erro ao reenviar e-mail de confirmação");
    }
  }, [setCooldown, setCanResend]);

  // Form rendering
  const renderForm = () => (
    <div className="flex flex-col gap-3 items-center w-full max-w-[1200px] mt-8">
      <p className="mb-2 text-lg sm:text-xl font-bold text-center">
        Insira seu e-mail para receber vaguinhas em tecnologia todos os dias na sua caixa de entrada! 😊
      </p>

      <Input
        ref={inputRef}
        type="email"
        placeholder="Insira seu e-mail"
        required
        value={email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.currentTarget.value)}
        className="w-full"
      />
      {validationError && <p className="text-red-500 text-sm w-full">{validationError}</p>}

      <Select value={stack} onValueChange={setStack} required>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione sua área" />
        </SelectTrigger>
        <SelectContent>
          {[
            'frontend',
            'backend',
            'mobile',
            // 'devops',
            // 'dados',
            'design'
          ].map(area => (
            <SelectItem key={area} value={area}>
              {area === 'design' ? 'Designer UI/UX' : area.charAt(0).toUpperCase() + area.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={seniorityLevel} onValueChange={setSeniorityLevel} required>
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

      <Button
        className="w-full py-3 sm:py-4 hover:scale-105 transition-transform cursor-pointer"
        variant="default"
        size="lg"
        onClick={saveEmail}
        disabled={!email || !!validationError || status === "loading" || !seniorityLevel || !stack}
      >
        {status === "loading" ? "Enviando…" : "Quero receber vaguinhas!"}
      </Button>
    </div>
  );

  // Success alert
  const renderSuccessAlert = () => (
    <Alert className="w-full max-w-md sm:max-w-lg lg:max-w-xl">
      <AlertTitle>Cadastro feito!</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <span>Enviamos um link de confirmação para seu e-mail.</span>
        <button
          onClick={() => resendConfirmation(localStorage.getItem("confirmationEmail") || "")}
          className={`text-blue-500 font-bold ml-0 sm:ml-1 ${
            !canResend ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:underline"
          }`}
          disabled={!canResend}
        >
          {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar confirmação"}
        </button>
      </AlertDescription>
    </Alert>
  );

  return (
    <div className="min-h-screen w-full flex flex-col relative px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.1}
        />
      )}

      <div className="absolute top-4 right-4 z-50">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="https://github.com/jmgrd98/vaguinhas"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-black dark:text-white hover:text-blue-500 transition-colors"
            >
              <FaGithub size={24} />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="left" align="end" className="bg-primary text-primary-foreground">
            <p>Favorite-nos no Github! ⭐</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <main className="flex-grow flex flex-col items-center justify-center">
        <p className={`font-caprasimo caprasimo-regular text-6xl sm:text-8xl text-[#ff914d] font-bold text-center`}>
          vaguinhas
        </p>

        {renderForm()}
        
        <Button 
          variant="ghost" 
          size="lg"
          onClick={() => setIsModalOpen(true)}
          className="my-5 cursor-pointer"
        >
          Já é cadastrado? Acesse sua área de assinante.
        </Button>

        {status === "error" && (
          <Alert variant="destructive" className="w-full max-w-md sm:max-w-lg lg:max-w-xl">
            <AlertTitle>Erro!</AlertTitle>
            <AlertDescription>Falha ao salvar. Tente novamente.</AlertDescription>
          </Alert>
        )}
        {status === "success" && renderSuccessAlert()}
      </main>

      <footer className="py-4 sm:py-6 w-full text-center border-t border-gray-200 dark:border-gray-700">
        <a
          className="text-sm sm:text-base text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors"
          href="https://github.com/jmgrd98"
          target="_blank"
          rel="noopener noreferrer"
        >
          Desenvolvido por João Marcelo Dantas
        </a>
      </footer>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href="https://wa.me/5561996386998"
              target="_blank"
              rel="noopener noreferrer"
              className="fixed bottom-4 right-4 z-50 bg-green-500 text-white p-3 sm:p-4 rounded-full shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-200"
            >
              <FaWhatsapp size={28} />
            </a>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            align="end"
            className="bg-primary text-primary-foreground"
          >
            <p>Alguma dúvida? Chama a gente no zap!</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Subscriber Area Modal */}
      <SubscriberAreaLoginModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        resendConfirmation={resendConfirmation}
      />
    </div>
  );
}