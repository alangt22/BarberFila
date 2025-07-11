"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  PlayCircle,
  StopCircle,
  Users,
  UserCheck,
  UserCircle2,
  Loader2,
  LogOut,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FiExternalLink } from "react-icons/fi";
import { MdWhatsapp } from "react-icons/md";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
type ItemFila = {
  id: number;
  servico: string;
  status: string;
  horaEntrada: string;
  usuario: {
    nome: string | null;
    telefone: string | null;
  };
};

export default function PainelBarbearia() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [fila, setFila] = useState<ItemFila[]>([]);
  const [loadingStatusId, setLoadingStatusId] = useState<number | null>(null);
  const [loadingDeleteId, setLoadingDeleteId] = useState<number | null>(null);

  // Redireciona se não estiver autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchFila(); // primeira chamada
      const interval = setInterval(fetchFila, 5000);
      toast.success("Autenticado com sucesso!");
      return () => clearInterval(interval);
    }
  }, [status]);

  // Evita renderizar enquanto carrega sessão
  if (status === "loading") {
    return (
      <div className="text-center mt-20 text-gray-500 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }
  // Evita renderizar se estiver deslogado
  if (status === "unauthenticated") {
    return null;
  }

  // Busca a fila
  const fetchFila = async () => {
    const res = await fetch("/api/fila/barbeiro");
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Erro ao buscar fila:", res.status, errorText);
      return;
    }

    try {
      const data = await res.json();
      setFila(data);
    } catch (err) {
      console.error("Erro ao converter resposta em JSON:", err);
    }
  };

  const alterarStatus = async (id: number, novoStatus: string) => {
    setLoadingStatusId(id);
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/fila/atualizar/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: novoStatus }),
      });

      if (novoStatus === "em_atendimento") {
        toast.success("Iniciando atendimento...");
      } else if (novoStatus === "finalizado") {
        toast.success("Atendimento finalizado!");
      }

      fetchFila();
    } finally {
      setLoadingStatusId(null);
    }
  };

  const excluirDaFila = async (id: number) => {
    setLoadingDeleteId(id);
    try {
      await fetch(`/api/fila/delete/${id}`, { method: "DELETE" });
      toast.warning("Item excluído com sucesso!");
      fetchFila();
    } finally {
      setLoadingDeleteId(null);
    }
  };

  const enviarMensagemWhatsApp = (
    telefone: string | null,
    nome: string | null
  ) => {
    if (!telefone) return alert("Telefone não disponível.");
    const texto = `Olá ${nome || "cliente"}, chegou a sua vez na barbearia!`;
    const link = `https://wa.me/${telefone}?text=${encodeURIComponent(texto)}`;
    window.open(link, "_blank");
  };

  const clienteSendoAtendido = fila.find(
    (item) => item.status === "em_atendimento"
  );
  const proximoCliente = fila.find((item) => item.status === "aguardando");

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "aguardando":
        return "border-yellow-400";
      case "em_atendimento":
        return "border-blue-400";
      case "finalizado":
        return "border-green-400";
      default:
        return "border-gray-300";
    }
  };
  const getStatusTextColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "aguardando":
        return "text-yellow-600";
      case "em_atendimento":
        return "text-blue-600";
      case "finalizado":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
    toast.warning("Desconectando...", { duration: 7000 });
  };

  const nome = session?.user?.name
    ? session.user.name.charAt(0).toUpperCase() +
      session.user.name.slice(1).toLowerCase()
    : "";

  return (
    <div className="w-full min-h-screen bg-gray-100 py-10 px-4">
      <h1 className="text-4xl font-bold text-center mb-10">
        Painel da Barbearia
      </h1>
      <div className="max-w-6xl mx-auto py-10 flex justify-between">
        <h3 className="text-4xl font-bold mb-4 text-center">{nome}</h3>
        <button
          onClick={handleLogout}
          className="bg-red-600 cursor-pointer flex items-center text-white font-semibold h-8 px-2 opacity-60 hover:opacity-100 rounded-md shadow transition-all duration-200"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sair
        </button>
      </div>

      {/** Proximo da fila **/}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {proximoCliente && (
          <Card className="border-l-8 border-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <UserCircle2 className="h-5 w-5 text-yellow-600" />
                <h2 className="text-xl font-semibold">Próximo da fila</h2>
              </div>
              <p className="text-lg font-medium">
                {proximoCliente.usuario?.nome || "Sem nome"}
              </p>
              <p className="text-sm text-gray-600">
                Serviço: {proximoCliente.servico}
              </p>
              <Button
                onClick={() =>
                  enviarMensagemWhatsApp(
                    proximoCliente.usuario.telefone,
                    proximoCliente.usuario.nome
                  )
                }
                className="mt-3 cursor-pointer hover:bg-green-600 hover:text-white"
                variant="outline"
              >
                <MdWhatsapp className="h-4 w-4 mr-2" /> Avisar no WhatsApp
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  alterarStatus(proximoCliente.id, "em_atendimento")
                }
                disabled={loadingStatusId === proximoCliente.id}
                className="cursor-pointer hover:bg-green-600 hover:text-white"
              >
                {loadingStatusId === proximoCliente.id ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <PlayCircle className="h-4 w-4 mr-1" />
                )}
                Iniciar
              </Button>
            </CardContent>
          </Card>
        )}

        {/** Cliente sendo atendido **/}
        {clienteSendoAtendido && (
          <Card className="border-l-8 border-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Em Atendimento</h2>
              </div>
              <p className="text-lg font-medium">
                {clienteSendoAtendido.usuario?.nome || "Sem nome"}
              </p>
              <p className="text-sm text-gray-600">
                Serviço: {clienteSendoAtendido.servico}
              </p>
              <Button
                variant="outline"
                onClick={() =>
                  alterarStatus(clienteSendoAtendido.id, "finalizado")
                }
                disabled={loadingStatusId === clienteSendoAtendido.id}
                className="cursor-pointer hover:bg-red-400 hover:text-white"
              >
                {loadingStatusId === clienteSendoAtendido.id ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <StopCircle className="h-4 w-4 mr-1" />
                )}
                Finalizar
              </Button>
              <Button
                onClick={() =>
                  enviarMensagemWhatsApp(
                    clienteSendoAtendido.usuario.telefone,
                    clienteSendoAtendido.usuario.nome
                  )
                }
                className="mt-3 ml-4 cursor-pointer hover:bg-green-600 hover:text-white"
                variant="outline"
              >
                <MdWhatsapp className="h-4 w-4 mr-2" /> Avisar no WhatsApp
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="max-w-6xl mx-auto">
        <h3 className="text-2xl font-semibold flex items-center gap-2 mb-4">
          <Users className="h-5 w-5" /> Fila de Espera
        </h3>

        {/** Link para seus clientes */}
        {session?.user?.email && (
          <div className="mb-6 text-center">
            <p className="text-gray-700 font-medium mb-2">
              Link para seus clientes:
            </p>
            <a
              href={`${
                process.env.NEXT_PUBLIC_URL
              }/login?barbeiro=${encodeURIComponent(session.user.email)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md shadow transition-all duration-200"
            >
              Link para agendamento
              <FiExternalLink className="w-5 h-5" />
            </a>
          </div>
        )}

        {/* Link para página pública de visualização da fila */}
        {session?.user?.email && (
          <div className="mb-6 text-center">
            <p className="text-gray-700 font-medium mb-2">
              Link público da sua fila:
            </p>
            <a
              href={`/barbeiro/${encodeURIComponent(session.user.email)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white font-semibold px-4 py-2 rounded-md shadow transition-all duration-200"
            >
              Ver fila pública <FiExternalLink className="w-5 h-5" />
            </a>
          </div>
        )}

        {fila.length === 0 ? (
          <p className="text-center text-gray-500">Nenhum cliente na fila.</p>
        ) : (
          <div className="grid gap-4">
            {fila.map((item) => (
              <Card
                key={item.id}
                className={`border-l-8 ${getStatusColor(item.status)}`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    {/* Informações do cliente */}
                    <div>
                      <h3 className="text-lg font-bold">
                        {item.usuario?.nome || "Sem nome"}
                      </h3>
                      <p className="text-sm font-bold">
                        Serviço: {item.servico}
                      </p>
                      <p className="text-sm font-bold">
                        Status:{" "}
                        <span className={getStatusTextColor(item.status)}>
                          {item.status}
                        </span>
                      </p>
                    </div>

                    {/* Ações */}
                    <div className="flex flex-wrap gap-2 justify-start md:justify-end">
                      <Select
                        value={item.status}
                        onValueChange={(value) => alterarStatus(item.id, value)}
                      >
                        <SelectTrigger
                          className={`w-[150px] capitalize border-2 ${getStatusColor(
                            item.status
                          )}`}
                        >
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aguardando" className="capitalize">
                            Aguardando
                          </SelectItem>
                          <SelectItem
                            value="em_atendimento"
                            className="capitalize"
                          >
                            Em atendimento
                          </SelectItem>
                          <SelectItem value="finalizado" className="capitalize">
                            Finalizado
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-start md:justify-end">
                      <Button
                        variant="outline"
                        onClick={() => alterarStatus(item.id, "em_atendimento")}
                        disabled={loadingStatusId === item.id}
                        className="cursor-pointer hover:bg-green-600 hover:text-white"
                      >
                        {loadingStatusId === item.id ? (
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        ) : (
                          <PlayCircle className="h-4 w-4 mr-1" />
                        )}
                        Iniciar
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => alterarStatus(item.id, "finalizado")}
                        disabled={loadingStatusId === item.id}
                        className="cursor-pointer hover:bg-red-400 hover:text-white"
                      >
                        {loadingStatusId === item.id ? (
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        ) : (
                          <StopCircle className="h-4 w-4 mr-1" />
                        )}
                        Finalizar
                      </Button>

                      <Button
                        onClick={() => excluirDaFila(item.id)}
                        disabled={loadingDeleteId === item.id}
                        className="cursor-pointer opacity-70 bg-red-300 hover:opacity-100 hover:bg-red-500 hover:text-white"
                      >
                        {loadingDeleteId === item.id ? (
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        ) : null}
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
