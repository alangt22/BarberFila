"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiUser, FiUsers } from "react-icons/fi"; // Ícones usados

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

export default function PainelCliente() {
  const [fila, setFila] = useState<ItemFila[]>([]);
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<ItemFila | null>(null);
  const router = useRouter();

 useEffect(() => {
    const fetchFila = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/fila", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        // Não autorizado - redirecionar para login
        router.push("/login");
        return;
      }

      if (!res.ok) {
        // Outro erro - pode tratar ou ignorar
        console.error("Erro ao buscar fila");
         router.push("/login");
        return;
      }

      const data = await res.json();
      setFila(data);

      // Encontrar a posição do usuário atual na fila (apenas não finalizados)
      const token_decoded = token ? JSON.parse(atob(token.split(".")[1])) : null;
      if (token_decoded) {
        const userInQueue = data.find(
          (item: ItemFila) => item.usuario?.telefone === token_decoded.phone_number
        );

        if (userInQueue) {
          const activeQueue = data.filter(
            (item: ItemFila) => item.status.toLowerCase() !== "finalizado"
          );
          const position = activeQueue.findIndex(
            (item: ItemFila) => item.id === userInQueue.id
          ) + 1;
          setUserPosition(position > 0 ? position : null);
          setCurrentUser(userInQueue);
        } else {
          setUserPosition(null);
          setCurrentUser(null);
        }
      }
    };

    fetchFila();
    const interval = setInterval(fetchFila, 5000);
    return () => clearInterval(interval);
  }, [router]);
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "aguardando":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "em_atendimento":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "finalizado":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusMessage = () => {
    if (!currentUser) {
      return {
        title: "Você não está na fila",
        message: "Faça seu agendamento para entrar na fila de atendimento.",
        color: "text-gray-600",
      };
    }

    switch (currentUser.status.toLowerCase()) {
      case "aguardando":
        const peopleAhead = userPosition ? userPosition - 1 : 0;
        return {
          title: `Você está na posição ${userPosition}`,
          message: `${
            userPosition === 1
              ? "Você é o próximo!"
              : `Ainda há ${peopleAhead} pessoa(s) na sua frente.`
          }`,
          color: "text-yellow-600",
        };
      case "em_atendimento":
        return {
          title: "Sua vez chegou!",
          message: "Dirija-se à barbearia para o seu atendimento.",
          color: "text-blue-600",
        };
      case "finalizado":
        return {
          title: "Atendimento finalizado",
          message: "Obrigado pela preferência!",
          color: "text-green-600",
        };
      default:
        return {
          title: "Status desconhecido",
          message: "Entre em contato com a barbearia.",
          color: "text-gray-600",
        };
    }
  };

  const statusInfo = getStatusMessage();
  

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Status do Usuário */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <FiUser className="w-8 h-8 text-blue-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Fila de Atendimento
            </h1>
            <h2 className={`text-xl font-semibold mb-2 ${statusInfo.color}`}>
              {statusInfo.title}
            </h2>
            <p className="text-gray-600 mb-4">{statusInfo.message}</p>

            {currentUser && (
              <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Serviço:</span>
                    <p className="text-gray-900">{currentUser.servico}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Status:</span>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        currentUser.status
                      )}`}
                    >
                      {currentUser.status}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Informações da Fila */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Informações da Fila
            </h2>
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
              {activeQueueCount()}{" "}
              {activeQueueCount() === 1 ? "pessoa" : "pessoas"} na fila
            </div>
          </div>

          {fila.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <FiUsers className="w-12 h-12 text-gray-400" />
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Fila vazia
              </h3>
              <p className="text-gray-500">
                Não há ninguém na fila no momento.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {fila.map((item, index) => (
                <div
                  key={item.id}
                  className={`border rounded-xl p-4 transition-all duration-200 ${
                    currentUser?.id === item.id
                      ? "bg-blue-50 border-blue-200 shadow-md"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                          currentUser?.id === item.id
                            ? "bg-blue-600"
                            : "bg-gray-400"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-500">
                            Serviço
                          </span>
                          <p className="font-semibold text-gray-900">
                            {item.servico}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">
                            Status
                          </span>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    {currentUser?.id === item.id && (
                      <div className="text-blue-600 font-semibold text-sm">
                        Você
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  function activeQueueCount() {
    return fila.filter((item) => item.status.toLowerCase() !== "finalizado")
      .length;
  }
}
