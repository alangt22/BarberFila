"use client";
import { signIn } from "next-auth/react";

// Ícones
import { FcGoogle } from "react-icons/fc";
import {
  MdAccessTime,
  MdCheckCircle,
  MdNotificationsActive,
} from "react-icons/md";
import { FiCheck } from "react-icons/fi";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [loader, setLoader] = useState(false);

  async function loginGoogle() {
    setLoader(true);
    signIn("google", {
      callbackUrl: "http://localhost:3000/painel-barbeiro",
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-6 shadow-md">
            <MdAccessTime className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Fila da Barbearia
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Sistema inteligente de agendamento e fila de espera para uma
            experiência mais organizada
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Bem-vindo ao nosso sistema!
                </h2>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  Aqui você pode agendar seu horário e acompanhar sua posição na
                  fila em tempo real. Sem mais esperas desnecessárias!
                </p>

                <div className="space-y-4 mb-8">
                  {[
                    "Agendamento rápido e fácil",
                    "Acompanhe sua posição na fila",
                    "Notificações em tempo real",
                  ].map((text, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <FiCheck className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="text-gray-700">{text}</span>
                    </div>
                  ))}
                </div>

                <button
                  disabled={loader}
                  onClick={loginGoogle}
                  className="cursor-pointer ml-4 inline-flex items-center justify-center gap-3 bg-white text-gray-700 font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg border border-gray-300 hover:-translate-y-0.5"
                >
                  {loader ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <div className="flex items-center gap-2">
                      {" "}
                      <FcGoogle className="w-6 h-6" />
                      Entrar com Google
                    </div>
                  )}
                </button>
              </div>

              <div className="hidden md:block">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl p-8 text-center">
                  <div className="w-32 h-32 mx-auto mb-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <MdAccessTime className="w-16 h-16 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Fila Organizada
                  </h3>
                  <p className="text-gray-600">
                    Sistema inteligente para melhor experiência
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-200">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdAccessTime className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Economia de Tempo
            </h3>
            <p className="text-gray-600">
              Não perca tempo esperando. Agende e chegue na hora certa.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-200">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdCheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Fácil de Usar
            </h3>
            <p className="text-gray-600">
              Interface simples e intuitiva para todos os usuários.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-200">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdNotificationsActive className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Notificações
            </h3>
            <p className="text-gray-600">
              Receba atualizações sobre sua posição na fila.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
