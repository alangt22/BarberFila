/* import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {

  
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Token ausente" }, { status: 401 });
    }

    const decoded = await verifyIdToken(token);
    const telefone = decoded.phone_number;

    if (!telefone) {
      return NextResponse.json({ error: "Telefone não encontrado no token" }, { status: 401 });
    }

    // Buscar cliente atual pela fila
    const cliente = await prisma.fila.findFirst({
      where: {
    usuario: {
      telefone: telefone,
    },
        status: {
          in: ["aguardando", "em_atendimento"],
        },
      },
      orderBy: {
        horaEntrada: "desc", // ou asc, dependendo da lógica
      },
    });

    if (!cliente || !cliente.barbeiroId) {
      return NextResponse.json([], { status: 200 }); // cliente não está na fila
    }

    // Buscar toda a fila do barbeiro
    const fila = await prisma.fila.findMany({
      where: {
        barbeiroId: cliente.barbeiroId,
        status: {
          in: ["aguardando", "em_atendimento"],
        },
      },
      include: {
        usuario: true,
      },
      orderBy: {
        horaEntrada: "asc",
      },
    });

    return NextResponse.json(fila);
  } catch (err) {
    console.error("Erro ao buscar fila:", err);
    return NextResponse.json({ error: "Erro ao buscar fila" }, { status: 500 });
  }
}
  */

import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Token ausente" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = await verifyIdToken(token);
    } catch (error) {
      console.error("Token inválido ou expirado:", error);
      return NextResponse.json(
        { error: "Token inválido ou expirado" },
        { status: 401 }
      );
    }

    const telefone = decoded.phone_number;
    if (!telefone) {
      return NextResponse.json(
        { error: "Telefone não encontrado no token" },
        { status: 401 }
      );
    }

    // Buscar cliente atual pela fila
    const cliente = await prisma.fila.findFirst({
      where: {
        usuario: { telefone },
        status: { in: ["aguardando", "em_atendimento"] },
      },
      orderBy: { horaEntrada: "desc" },
    });

    if (!cliente || !cliente.barbeiroId) {
      return NextResponse.json([], { status: 200 }); // cliente não está na fila
    }

    // Buscar toda a fila do barbeiro
    const fila = await prisma.fila.findMany({
      where: {
        barbeiroId: cliente.barbeiroId,
        status: { in: ["aguardando", "em_atendimento"] },
      },
      include: { usuario: true },
      orderBy: { horaEntrada: "asc" },
    });

    return NextResponse.json(fila);
  } catch (err) {
    console.error("Erro ao buscar fila:", err);
    return NextResponse.json({ error: "Erro ao buscar fila" }, { status: 500 });
  }
}
