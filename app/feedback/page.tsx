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
import { useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";

const emailSchema = z.string().email("E-mail inválido").toLowerCase();

// Main content component
function FeedbackContent() {
  const searchParams = useSearchParams();
  const emailFromParams = searchParams.get('email') || '';
  
  // Form states
  const [email, setEmail] = useState(emailFromParams || '');
  const [rating, setRating] = useState([5]);
  const [feedback, setFeedback] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    if (validationError || !email) {
      toast.error("Por favor, preencha o e-mail corretamente");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email, 
          rating: rating[0], 
          feedback: feedback.trim() || null 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          toast.error(data.message || "E-mail não cadastrado. Por favor, cadastre-se primeiro.");
        } else {
          throw new Error(data.message || "Erro ao enviar feedback");
        }
        return;
      }

      // Show success feedback
      toast.success("Obrigado pelo seu feedback! 🙏");
      
      // Reset form
      setRating([5]);
      setFeedback("");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Ocorreu um erro. Por favor, tente novamente mais tarde.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (value: number) => {
    if (value <= 2) return "Muito insatisfeito";
    if (value <= 4) return "Insatisfeito";
    if (value <= 6) return "Neutro";
    if (value <= 8) return "Satisfeito";
    return "Muito satisfeito";
  };

  const getRatingColor = (value: number) => {
    if (value <= 2) return "text-red-500";
    if (value <= 4) return "text-orange-500";
    if (value <= 6) return "text-yellow-500";
    if (value <= 8) return "text-green-500";
    return "text-green-600";
  };

  const getRatingEmoji = (value: number) => {
    if (value <= 2) return "😢";
    if (value <= 4) return "😕";
    if (value <= 6) return "😐";
    if (value <= 8) return "😊";
    return "😍";
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
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

        <div className="flex flex-col gap-4 items-center w-full max-w-[600px] mt-8">
          <p className="mb-4 text-lg sm:text-xl font-bold text-center">
            Como foi sua experiência com o vaguinhas?
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

          <div className="w-full space-y-4">
            <div>
              <Label className="text-muted-foreground px-2 py-1.5 text-xs">
                Avaliação
              </Label>
              <div className="flex items-center justify-center mb-4">
                <span className="text-6xl transition-all duration-200 transform hover:scale-110">
                  {getRatingEmoji(rating[0])}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">1</span>
                <span className={`text-lg font-semibold ${getRatingColor(rating[0])}`}>
                  {rating[0]} - {getRatingLabel(rating[0])}
                </span>
                <span className="text-sm text-muted-foreground">10</span>
              </div>
              <Slider
                value={rating}
                onValueChange={setRating}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              {/* Optional: Show emoji scale below slider */}
              <div className="flex justify-between mt-3 px-1">
                <span className="text-sm opacity-60">😢</span>
                <span className="text-sm opacity-60">😕</span>
                <span className="text-sm opacity-60">😐</span>
                <span className="text-sm opacity-60">😊</span>
                <span className="text-sm opacity-60">😍</span>
              </div>
            </div>
          </div>

          <div className="w-full">
            <Label className="text-muted-foreground px-2 py-1.5 text-xs">
              Comentários (opcional)
            </Label>
            <Textarea
              placeholder="Compartilhe sua experiência, sugestões ou críticas..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right mt-1">
              {feedback.length}/500
            </p>
          </div>

          <Button
            className="w-full py-3 sm:py-4 hover:scale-105 transition-transform cursor-pointer mt-2"
            variant="default"
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting || !email || !!validationError}
          >
            {isSubmitting ? "Enviando…" : "Enviar feedback"}
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
export default function Feedback() {
  return (
    <TooltipProvider>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
        <FeedbackContent />
      </Suspense>
    </TooltipProvider>
  );
}