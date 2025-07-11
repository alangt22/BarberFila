import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Users,
  UserCircle2,
  Scissors,
  Clock3,
  CheckCircle2,
  PlayCircle,
} from "lucide-react";

type Props = { params: { email: string } };

export default async function BarbeiroFilaPage({ params }: Props) {
  const email = decodeURIComponent(params.email);

  const barbeiro = await prisma.usuario.findUnique({
    where: { email },
  });

  if (!barbeiro || barbeiro.role !== "barbeiro") {
    return <p className="text-center text-red-500 mt-10">Barbeiro não encontrado.</p>;
  }

  const fila = await prisma.fila.findMany({
    where: {
      barbeiroId: barbeiro.id,
      status: {
        in: ["aguardando", "em_atendimento", "finalizado"],
      },
    },
    include: {
      usuario: true,
    },
    orderBy: {
      horaEntrada: "asc",
    },
  });

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "aguardando":
        return {
          icon: <Clock3 className="w-4 h-4 text-yellow-500" />,
          text: "Aguardando",
          color: "text-yellow-600",
        };
      case "em_atendimento":
        return {
          icon: <PlayCircle className="w-4 h-4 text-blue-500" />,
          text: "Em atendimento",
          color: "text-blue-600",
        };
      case "finalizado":
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
          text: "Finalizado",
          color: "text-green-600",
        };
      default:
        return {
          icon: null,
          text: status,
          color: "text-gray-600",
        };
    }
  };
  
  const nome = barbeiro?.nome?.toUpperCase() || "";

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Fila da Barbearia</h1>
        <h2 className="text-2xl text-blue-600 font-semibold">{nome}</h2>
      </div>

      {fila.length === 0 ? (
        <p className="text-center text-gray-500">Nenhum cliente na fila.</p>
      ) : (
        <ul className="space-y-4">
          {fila.map((item, index) => {
            const statusInfo = getStatusInfo(item.status);
            return (
              <li
                key={item.id}
                className={`p-4 rounded-lg border shadow-md bg-white flex items-center gap-4 ${
                  index === 0 ? "border-blue-500" : "border-gray-200"
                }`}
              >
                <div className="flex-shrink-0">
                  {index === 0 ? (
                    <CheckCircle2 className="w-8 h-8 text-blue-500" />
                  ) : (
                    <UserCircle2 className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg">
                    {item.usuario?.nome || "Sem nome"}
                  </p>
                  <div className="flex items-center text-sm text-gray-600 mt-1 gap-2">
                    <Scissors className="w-4 h-4" />
                    <span>{item.servico}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mt-1 gap-2">
                    <Clock3 className="w-4 h-4" />
                    <span>
                      Entrada:{" "}
                      {new Date(item.horaEntrada).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className={`flex items-center text-sm mt-1 gap-2 ${statusInfo.color}`}>
                    {statusInfo.icon}
                    <span>{statusInfo.text}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-700 font-semibold px-3 py-1 bg-blue-100 rounded">
                  #<span className="font-bold text-xl">{index + 1}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-10 text-center">
        <Link
        target="_blank"
          href={`/login?barbeiro=${encodeURIComponent(email)}`}
          className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
        >
          Entrar na Fila
        </Link>
      </div>
    </div>
  );
}
