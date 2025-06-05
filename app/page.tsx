"use client";

import { useState, useRef, useEffect } from "react";
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

const emailSchema = z.string().email("E-mail inválido").toLowerCase();

export default function Home() {
  const [email, setEmail] = useState("");
  const [seniorityLevel, setSeniorityLevel] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [cooldown, setCooldown] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
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

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => {
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

  const validateEmail = () => {
    try {
      emailSchema.parse(email);
      setValidationError(null);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationError(error.errors[0].message);
      }
      return false;
    }
  };

  useEffect(() => {
    if (email) validateEmail();
  }, [email]);

  const saveEmail = async () => {
    if (!validateEmail()) return;
    setStatus("loading");

    const mappedSeniority =
      seniorityLevel === "junior"
        ? ["Entry level", "Internship"]
        : ["Mid-Senior level", "Associate"];

    try {
      const res = await fetch("/api/save-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          seniorityLevel: mappedSeniority,
        }),
      });

      if (res.status === 500) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro no servidor");
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
      }

      if (res.status === 409) {
        toast.warning("Esse e-mail já está cadastrado!", {
          description: "Obrigado, seu e-mail já foi validado.",
        });
        setStatus("error");
        return;
      }

      localStorage.setItem("confirmationEmail", email);
      localStorage.setItem("lastResend", Date.now().toString());
      setCooldown(60);
      setCanResend(false);

      setStatus("success");
      setShowConfetti(true);
      setEmail("");
      setSeniorityLevel("");
    } catch (err: unknown) {
      console.error(err);
      setStatus("error");
      toast.error("Erro ao salvar e-mail");
    }
  };

  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  const resendConfirmation = async () => {
    try {
      const now = Date.now();
      const lastResend = localStorage.getItem("lastResend");

      if (lastResend && now - Number(lastResend) < 60000) {
        toast.warning("Aguarde 1 minuto para reenviar o e-mail de confirmação");
        return;
      }

      const savedEmail = localStorage.getItem("confirmationEmail");
      if (!savedEmail) {
        toast.warning("Nenhum e-mail encontrado para reenvio");
        return;
      }

      const res = await fetch("/api/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: savedEmail }),
      });

      if (res.status === 409) {
        toast.warning("Esse e-mail já está confirmado!", {
          description: "Obrigado, seu e-mail já foi validado.",
        });
        return;
      }

      if (!res.ok) {
        throw new Error();
      }

      localStorage.setItem("lastResend", now.toString());
      setCooldown(60);
      setCanResend(false);

      toast.success("E-mail de confirmação reenviado!");
    } catch {
      toast.error("Erro ao reenviar e-mail de confirmação");
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

      <Link
        href="https://github.com/jmgrd98/vaguinhas"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-4 right-4 z-50 flex items-center gap-2 text-sm sm:text-base text-black dark:text-white hover:text-blue-500 transition-colors"
      >
        <p className="hidden xs:block">Favorite-nos no Github!</p>
        <FaGithub size={20} className="sm:size-[24]" />
      </Link>

      <main className="flex-grow flex flex-col items-center justify-center">
        <p
          className={`font-caprasimo caprasimo-regular text-6xl sm:text-8xl text-[#ff914d] font-bold text-center`}
        >
          vaguinhas
        </p>
        <div className="flex flex-col gap-5   items-center w-full max-w-[1200px] mt-8 ">
          <p className="mb-2 text-lg sm:text-xl font-bold text-center">
            Insira seu e-mail para receber vaguinhas em tecnologia todos os
            dias na sua caixa de entrada! 😊
          </p>

          <Input
            ref={inputRef}
            type="email"
            placeholder="Insira seu e-mail"
            required
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            className="w-full"
          />

          <Select
            value={seniorityLevel}
            onValueChange={setSeniorityLevel}
            required
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione seu nível profissional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="junior">Júnior</SelectItem>
              <SelectItem value="mid-level">Pleno</SelectItem>
              <SelectItem value="senior">Sênior</SelectItem>
            </SelectContent>
          </Select>

          <Button
            className="w-full py-3 sm:py-4 hover:scale-105 transition-transform"
            variant="default"
            size="lg"
            onClick={saveEmail}
            disabled={
              !email ||
              !!validationError ||
              status === "loading" ||
              !seniorityLevel
            }
          >
            {status === "loading" ? "Enviando…" : "Quero receber vaguinhas!"}
          </Button>

          {status === "error" && (
            <Alert variant="destructive" className="w-full max-w-md sm:max-w-lg lg:max-w-xl">
              <AlertTitle>Erro!</AlertTitle>
              <AlertDescription>Falha ao salvar. Tente novamente.</AlertDescription>
            </Alert>
          )}
          {status === "success" && (
            <Alert className="w-full">
              <AlertTitle>Cadastro feito! ✅</AlertTitle>
              <AlertDescription>
                Enviamos um link de confirmação para seu e-mail.
                <button 
                  onClick={resendConfirmation}
                  className={`text-blue-500 ml-0 sm:ml-1 ${
                    !canResend
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer hover:underline"
                  }`}
                  disabled={!canResend}
                >
                  {cooldown > 0
                    ? `Reenviar em ${cooldown}s`
                    : "Reenviar confirmação"}
                </button>
              </AlertDescription>
            </Alert>
          )}
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
