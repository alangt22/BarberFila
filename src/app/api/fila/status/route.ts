import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Context {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, context: Context) {
  const params = await context.params;
  const idStr = params.id;

  if (!idStr) {
    return NextResponse.json({ error: "ID não informado" }, { status: 400 });
  }

  const id = Number(idStr);

  if (isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const { status } = await req.json();

    if (!status || typeof status !== "string") {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    const atualizado = await prisma.fila.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(atualizado);
  } catch (error) {
    console.error("Erro ao atualizar:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
