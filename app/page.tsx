"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import logo from "@/public/vaguinhas.svg";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import { z } from "zod";
import { FaWhatsapp } from "react-icons/fa";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const emailSchema = z.string().email("E-mail inválido").toLowerCase();

export default function Home() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    try {
      const res = await fetch("/api/save-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      setStatus("success");
      setEmail("");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };


  return (
    <div className="min-h-screen w-full flex flex-col">
      <main className="flex-grow flex flex-col items-center px-4">
        <Image
          className="dark:invert"
          src={logo}
          alt="vaguinhas logo"
          width={440}
          priority
        />
        <div className="flex flex-col gap-5 items-center">
          <p className="mb-2 text-xl font-bold text-center">
            Insira seu e-mail para receber vaguinhas em tecnologia todos os dias na sua caixa de entrada!
          </p>
          <Input
            ref={inputRef}
            type="email"
            placeholder="Insira seu e-mail"
            required
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />
          <Button
            className="w-full cursor-pointer hover:scale-105"
            variant="default"
            size="lg"
            onClick={saveEmail}
            disabled={!email || !!validationError || status === "loading"}
          >
            {status === "loading" ? "Enviando…" : "Quero receber vaguinhas!"}
          </Button>

          {status === "error" && (
            <Alert variant="destructive" className="w-full">
              <AlertTitle>Erro!</AlertTitle>
              <AlertDescription>
                Falha ao salvar. Tente novamente.
              </AlertDescription>
            </Alert>
          )}
          {status === "success" && (
            <Alert className="w-full">
              <AlertTitle>Sucesso!</AlertTitle>
              <AlertDescription>
                E-mail salvo com sucesso!
              </AlertDescription>
            </Alert>
          )}
        </div>
      </main>

      <footer className="py-4 w-full text-center border-t">
        <a
          className="hover:text-blue-500"
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
              className="fixed bottom-4 right-4 z-50 bg-green-500 text-white p-4 rounded-full shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-200"
            >
              <FaWhatsapp size={32} />
            </a>
          </TooltipTrigger>
          <TooltipContent side="top" align="end" className="bg-primary text-primary-foreground">
            <p>Alguma dúvida? Chama a gente no zap!</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
