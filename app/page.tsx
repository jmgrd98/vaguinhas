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

export default function Home() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const [isValid, setIsValid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      setIsValid(inputRef.current.checkValidity());
      if (status === "error" || status === "success") {
        setStatus("idle");
      }
    }
  }, [email]);

  const saveEmail = async () => {
    if (!isValid) {
      return;
    }
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
            className="w-full"
            variant="default"
            size="lg"
            onClick={saveEmail}
            disabled={!isValid || status === "loading"}
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
    </div>
  );
}
