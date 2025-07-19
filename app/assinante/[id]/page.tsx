"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { FaArrowLeft } from "react-icons/fa";

interface UserData {
  _id: string;
  email: string;
  seniorityLevel: string;
  stacks: string[];
  confirmed: boolean;
  createdAt: string;
}

export default function SubscriberPage() {
  const { id } = useParams();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    seniorityLevel: "",
    stacks: [] as string[],
  });

  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/users/${id}`);
        if (!res.ok) throw new Error("Falha ao carregar dados do usuário");
        const data: UserData = await res.json();
        setUserData(data);
        setFormData({
          seniorityLevel: data.seniorityLevel,
          stacks: data.stacks,
        });
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        toast.error("Falha ao carregar suas informações");
      } finally {
        setLoading(false);
      }
    }
    fetchUserData();
  }, [id]);

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Falha ao atualizar informações");
      toast.success("Preferências atualizadas com sucesso!");
      setUserData({ ...userData!, ...formData });
    } catch (error) {
      console.error("Erro na atualização:", error);
      toast.error("Falha ao atualizar suas informações");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Usuário não encontrado</h1>
          <Button className="cursor-pointer" onClick={() => router.push("/")}>Voltar para início</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-8">
      <div className="relative w-full mb-8 flex items-center">
        <Button
          variant="outline"
          className="absolute left-0 cursor-pointer"
          onClick={() => router.push("/")}
        >
          <FaArrowLeft className="mr-2" /> Voltar
        </Button>
        <p className="mx-auto font-caprasimo caprasimo-regular text-5xl text-[#ff914d] font-bold text-center">
          vaguinhas
        </p>
      </div>


     
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Painel de Assinante</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Gerencie suas preferências e informações da conta
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-xl font-semibold mb-2">Informações da Conta</h2>
            <div className="space-y-2">
              <p>
                <span className="font-medium">E-mail:</span> {userData.email}
              </p>
              <p>
                <span className="font-medium">Membro desde:</span>{' '}
                {new Date(userData.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <h2 className="text-xl font-bold mb-6">Atualizar Preferências</h2>

          <div className="space-y-6">
            {/* Seniority Level */}
            <div>
              <label className="block text-sm font-medium mb-2">Senioridade</label>
              <Select
                value={formData.seniorityLevel}
                onValueChange={(value) =>
                  setFormData({ ...formData, seniorityLevel: value })
                }
              >
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">Júnior</SelectItem>
                  <SelectItem value="pleno">Pleno</SelectItem>
                  <SelectItem value="senior">Sênior</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Single Stack Select */}
            <div>
              <label className="block text-sm font-medium mb-2">Área</label>
              <Select
                value={formData.stacks[0] || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, stacks: [value] })
                }
                required
              >
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder="Selecione sua área" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    'frontend',
                    'backend',
                    'mobile',
                    'fullstack',
                    // 'devops',
                    'dados',
                    'design'
                  ].map(area => (
                    <SelectItem key={area} value={area}>
                      {area === 'design' ? 'Designer UI/UX' : area.charAt(0).toUpperCase() + area.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleUpdate}
              disabled={updating}
              className="w-full sm:w-auto cursor-pointer"
            >
              {updating ? "Atualizando…" : "Salvar alterações"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
