"use client";
import { useEffect, useRef, useState } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { set } from "react-hook-form";

export default function LoginPage() {
  const [nome, setNome] = useState("");
  const [phone, setPhone] = useState("+55");
  const [servico, setServico] = useState("Corte normal");
  const [code, setCode] = useState("");
  const [barbeiro, setBarbeiro] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const router = useRouter();

  const searchParams = useSearchParams();
  const barbeiroEmail = searchParams.get("barbeiro") || "";

  useEffect(() => {
    if (barbeiroEmail) {
      setBarbeiro(barbeiroEmail);
    }
  }, [barbeiroEmail]);

  useEffect(() => {
    if (!recaptchaVerifierRef.current && typeof window !== "undefined") {
      recaptchaVerifierRef.current = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {
            console.log("reCAPTCHA resolved");
          },
        }
      );
      recaptchaVerifierRef.current.render().catch(console.error);
    }
  }, []);

  const handleSendCode = async () => {
    setLoading(true);
    const phoneNumberRegex = /^\+\d{10,15}$/;
    if (!phone || !phoneNumberRegex.test(phone)) {
      toast.error(
        "Digite o número de telefone no formato internacional: +5511999999999"
      );
      setLoading(false);
      return;
    }

    try {
      const result = await signInWithPhoneNumber(
        auth,
        phone,
        recaptchaVerifierRef.current!
      );
      setConfirmationResult(result);
      toast.success("Código SMS enviado!");
    } catch (error) {
      console.error("Erro ao enviar código:", error);
      toast.error("Erro ao enviar código. Verifique o número e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    
    if (!code || !nome.trim()) {
      toast.warning("Digite o código e o nome.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await confirmationResult.confirm(code);
      const token = await userCredential.user.getIdToken();
      localStorage.setItem("token", token);

      const res = await fetch("/api/usuario/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome,
          telefone: phone,
          barbeiroEmail: barbeiro,
          servico,
        }),
      });
      if (!res.ok) {
        const erroTexto = await res.text(); // 👈 Mostra o erro exato
  console.error("Erro ao salvar:", erroTexto);
        throw new Error("Erro ao salvar no banco");
      }
      toast.success("Login realizado com sucesso!");
      router.push("/painel-cliente");
    } catch (error) {
      console.error("Erro ao verificar código:", error);
      toast.error("Código inválido ou erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Login via SMS
            </h1>
            <p>Barbeiro: {barbeiro}</p>
            <p className="text-gray-600">
              Digite seu telefone para receber o código de verificação
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de telefone
              </label>
              <input
                type="tel"
                placeholder="+5511999999999"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seu nome
              </label>
              <input
                type="text"
                placeholder="Digite seu nome completo"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escolha o serviço
              </label>
              <select
                value={servico}
                onChange={(e) => setServico(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
              >
                <option value="Corte normal">Corte normal</option>
                <option value="Barba">Barba</option>
                <option value="Corte + Barba">Corte + Barba</option>
                <option value="Sobrancelha">Sobrancelha</option>
              </select>
            </div>

            {!confirmationResult ? (
              <button
              disabled={loading}
                onClick={handleSendCode}
                className="w-full bg-blue-600 cursor-pointer hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                { loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Enviar Código SMS"
                )}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 text-sm font-medium">
                    ✅ Código SMS enviado! Verifique suas mensagens.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de verificação
                  </label>
                  <input
                    type="text"
                    placeholder="Digite o código recebido"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 text-center text-lg font-mono tracking-widest"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={6}
                  />
                </div>

                <button
                  disabled={loading}
                  onClick={handleVerifyCode}
                  className="w-full cursor-pointer bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  { loading ? (
                    <Loader2 className="animate-spin text-center" />
                  ) : (
                    "Verificar Código"
                  )}
                </button>
              </div>
            )}
          </div>

          <div id="recaptcha-container" />
        </div>
      </div>
    </div>
  );
}
