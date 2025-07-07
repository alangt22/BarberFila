"use client";
import { useEffect, useState } from "react";
import { Container } from "../../components/container";
import { Input } from "../../components/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import toast from "react-hot-toast";
import { Loading } from "../../components/loading";
import { useRouter } from "next/navigation";
import Link from "next/link";

const schema = z.object({
  email: z.string().email("E-mail inválido").nonempty("E-mail obrigatório"),
  password: z.string().nonempty("Senha obrigatória"),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
 
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  useEffect(() => {
    async function handleLogout() {
      await signOut(auth);
    }

    handleLogout();
  }, []);

async function onSubmit(data: FormData) {
  setLoading(true);

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );
    const user = userCredential.user;

    // 🔒 Força a emissão de um novo token válido
    const token = await user.getIdToken(true);

    // (Opcional) você pode enviar esse token para a API ou salvar em um state/context
    // Exemplo:
    const response = await fetch("/api/fila", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar fila");
    }

    toast.success("Logado com sucesso!");
    router.push("/painel-barbeiro");
  } catch (error: any) {
    console.error("Erro ao logar:", error);
    toast.error("Erro ao logar. Verifique os dados.");
  } finally {
    setLoading(false);
  }
}


  return (
    <Container>
      <div className=" w-full  min-h-screen flex justify-center items-center flex-col gap-4 ">
        <div className="mb-6 max-w-sm">
          <span className="text-7xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Aluap
            <span className="bg-gradient-to-r from-purple-500 to-purple-900 bg-clip-text text-transparent">
              DEV
            </span>
          </span>
        </div>

        <form
          className="bg-white/60 max-w-xl w-full rounded-lg p-4"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="mb-3">
            <Input
              type="email"
              placeholder="Digite seu e-mail"
              name="email"
              error={errors.email?.message}
              register={register}
            />
          </div>
          <div className="mb-3">
            <Input
              type="password"
              placeholder="Digite sua senha"
              name="password"
              error={errors.password?.message}
              register={register}
            />
          </div>

          <button
            className="bg-gradient-to-r from-purple-400 to-blue-600 cursor-pointer w-full rounded-md text-white h-10 font-medium flex items-center justify-center
            opacity-80 hover:opacity-100"
            type="submit"
          >
            {loading ? <Loading /> : "Acessar"}
          </button>
        </form>
        <span>
          Ainda nao possui uma conta?{" "}
          <Link href="/register" className="text-black hover:text-purple-900">
            Cadastre-se
          </Link>
        </span>
      </div>
    </Container>
  );
}
