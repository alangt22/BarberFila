// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import type { NextAuthOptions } from "next-auth"
import { authOptions } from "@/lib/auth-options"
  import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],


callbacks: {
  async signIn({ user, account, profile }) {
    if (!user.email) return false; // falha se sem email

    try {
      // tenta encontrar usuário barbeiro pelo email
      const existingBarbeiro = await prisma.usuario.findUnique({
        where: { email: user.email },
      });

      if (!existingBarbeiro) {
        // cria novo barbeiro
        await prisma.usuario.create({
          data: {
            nome: user.name,
            email: user.email,
            role: "barbeiro",
            firebaseId: account?.providerAccountId || "", // ajuste conforme necessário
            // outros campos que precisar
          },
        });
      } else {
        // atualiza dados se quiser (nome, etc)
        await prisma.usuario.update({
          where: { email: user.email },
          data: {
            nome: user.name,
          },
        });
      }

      return true;
    } catch (error) {
      console.error("Erro no signIn callback:", error);
      return false;
    }
  },
  // outros callbacks...
},

  secret: process.env.JWT_SECRET as string,
})

export const GET = handler
export const POST = handler
