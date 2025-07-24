"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

// Main content component
function ConseguiUmaVagaContent() {
  const searchParams = useSearchParams();
  const emailFromParams = searchParams.get('email') || '';

  const windowSize = useWindowSize();
  
  // Form states
  const [email, setEmail] = useState(emailFromParams || '');
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
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

  useEffect(() => {
    if (emailFromParams) {
      setEmail(emailFromParams);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [emailFromParams]);

  // Handle form submission
  const handleSubmit = async () => {
    if (validationError || !email || !company || !role) {
      toast.error("Por favor, preencha todos os campos corretamente");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/hired", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, company, role, message }),
      });

      if (!response.ok) {
        throw new Error("Erro ao enviar informações");
      }

      // Show success feedback
      toast.success("Obrigado por nos informar! Parabéns pela conquista! 🎉");
      setShowConfetti(true);
      
      // Reset form
      setCompany("");
      setRole("");
      setMessage("");
    } catch (error) {
        console.error('Error:', error);
      toast.error("Ocorreu um erro. Por favor, tente novamente mais tarde.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <div className="flex flex-col gap-3 items-center w-full max-w-[1200px] mt-8">
          <p className="mb-2 text-lg sm:text-xl font-bold text-center">
            Você conseguiu uma vaga através do vaguinhas?
          </p>

          <div className="w-full">
            <Label className="text-muted-foreground px-2 py-1.5 text-xs">
              E-mail
            </Label>
            <Input
              ref={inputRef}
              type="email"
              placeholder="Insira seu e-mail"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
            {validationError && <p className="text-red-500 text-sm w-full mt-1">{validationError}</p>}
          </div>

          <div className="w-full">
            <Label className="text-muted-foreground px-2 py-1.5 text-xs">
              Empresa
            </Label>
            <Input
              type="text"
              placeholder="Qual empresa?"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="w-full">
            <Label className="text-muted-foreground px-2 py-1.5 text-xs">
              Cargo
            </Label>
            <Input
              type="text"
              placeholder="Qual cargo?"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="w-full">
            <Label className="text-muted-foreground px-2 py-1.5 text-xs">
              Deixe uma mensagem (opcional)
            </Label>
            <Textarea
              placeholder="Conte-nos mais sobre como foi sua experiência"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full"
            />
          </div>

          <Button
            className="w-full py-3 sm:py-4 hover:scale-105 transition-transform cursor-pointer mt-4"
            variant="default"
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting || !email || !company || !role || !!validationError}
          >
            {isSubmitting ? "Enviando…" : "Enviar informações"}
          </Button>
        </div>
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
    </div>
  );
}

// Main exported component with Suspense
export default function ConseguiUmaVaga() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <ConseguiUmaVagaContent />
    </Suspense>
  );
}