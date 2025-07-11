// app/api/fila/publico/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const barbeiroEmail = req.nextUrl.searchParams.get("barbeiro");

  if (!barbeiroEmail) {
    return NextResponse.json(
      { error: "Parâmetro 'barbeiro' é obrigatório" },
      { status: 400 }
    );
  }

  const barbeiro = await prisma.usuario.findUnique({
    where: { email: barbeiroEmail },
  });

  if (!barbeiro || barbeiro.role !== "barbeiro") {
    return NextResponse.json({ error: "Barbeiro inválido" }, { status: 404 });
  }

  const fila = await prisma.fila.findMany({
    where: {
      barbeiroId: barbeiro.id,
      status: {
        not: "cancelado",
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
}
