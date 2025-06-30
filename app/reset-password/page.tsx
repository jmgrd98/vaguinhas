"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  
  useEffect(() => {
    console.log("INITIALIZING", initializing);
    const query = new URLSearchParams(window.location.search);
    setToken(query.get("token"));
    setInitializing(false);
  }, []);

  const handleSubmit = async () => {
    if (!token) {
      toast.error("Token inválido");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/users/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      if (res.ok) {
        const data = await res.json();
        
        toast.success("Senha redefinida com sucesso!");
        
        // Redirect to user's page using ID from response
        router.push(`/assinante/${data.userId}`);
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Falha ao redefinir senha");
      }
    } catch (error: unknown) {
      console.error("Erro ao redefinir senha:", error);
      toast.error("Erro ao processar pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <p className="mx-auto font-caprasimo caprasimo-regular text-5xl text-[#ff914d] font-bold text-center">
        vaguinhas
      </p>
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 sm:p-8">
        <h1 className="text-2xl font-bold mb-6">Redefinir Senha</h1>
        
        <div className="space-y-4">
          <Input
            type="password"
            placeholder="Nova senha (mínimo 6 caracteres)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full"
          />
          <Input
            type="password"
            placeholder="Confirmar nova senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full"
          />
          
          <Button
            onClick={handleSubmit}
            disabled={loading || !token || !newPassword || !confirmPassword}
            className="w-full"
          >
            {loading ? "Processando..." : "Redefinir Senha"}
          </Button>
        </div>
      </div>
    </div>
  );
}