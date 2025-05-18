"use client";

import { useState } from "react";
import Image from "next/image";
import logo from "@/public/vaguinhas.svg";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";  

export default function Home() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const saveEmail = async () => {
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
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow flex flex-col items-center">
        <Image
          className="dark:invert"
          src={logo}
          alt="vaguinhas logo"
          width={440}
          priority
        />
        <div className="flex flex-col gap-5 items-center">
          <p className="text-xl font-bold text-center">
            Insira seu e-mail para receber vagas em tecnologia todos os dias!
          </p>
          <Input
            type="email"
            placeholder="Insira seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />
          <Button
            className="w-full"
            variant="default"
            size="lg"
            onClick={saveEmail}
            disabled={!email || status === "loading"}
          >
            {status === "loading" ? "Enviando…" : "Enviar"}
          </Button>
          {status === "success" && (
            <p className="text-green-600">E-mail salvo com sucesso!</p>
          )}
          {status === "error" && (
            <p className="text-red-600">Falha ao salvar. Tente novamente.</p>
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
