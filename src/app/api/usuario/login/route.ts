import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyIdToken } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token)
      return NextResponse.json({ error: "Token ausente" }, { status: 401 });

    const decoded = await verifyIdToken(token);
    const { nome, telefone, barbeiroEmail, servico } = await req.json();

    if (!barbeiroEmail|| !servico) {
      return NextResponse.json(
        { error: "Email do barbeiro ou serviço ausente" },
        { status: 400 }
      );
    }

    // Busca barbeiro
    const barbeiro = await prisma.usuario.findUnique({
      where: { email: barbeiroEmail },
    });

    if (!barbeiro || barbeiro.role !== "barbeiro") {
      return NextResponse.json({ error: "Barbeiro inválido" }, { status: 404 });
    }

    // Verifica se cliente já existe
    let usuario = await prisma.usuario.findUnique({
      where: { firebaseId: decoded.uid },
    });

    if (!usuario) {
      // Cria novo cliente
      usuario = await prisma.usuario.create({
        data: {
          firebaseId: decoded.uid,
          nome,
          telefone,
          role: "cliente",
        },
      });
    } else {
      // Atualiza nome/telefone se necessário
      usuario = await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          nome: usuario.nome || nome,
          telefone: usuario.telefone || telefone,
        },
      });
    }

    // Verifica se já está na fila do barbeiro
    const jaNaFila = await prisma.fila.findFirst({
      where: {
        usuarioId: usuario.id,
        barbeiroId: barbeiro.id,
        status: { in: ["aguardando", "em_atendimento"] },
      },
    });

    if (!jaNaFila) {
      await prisma.fila.create({
        data: {
          usuario: { connect: { id: usuario.id } }, // cliente
          barbeiro: { connect: { id: barbeiro.id } }, // barbeiro
          status: "aguardando",
          servico: servico || "Corte normal",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erro ao salvar usuário:", err);
    return NextResponse.json(
      { error: "Erro ao salvar usuário" },
      { status: 500 }
    );
  }
}
