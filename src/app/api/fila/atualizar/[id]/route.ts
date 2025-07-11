import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
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
    const body = await req.json();

    const status = body?.status;

    if (!status || typeof status !== "string") {
      return NextResponse.json(
        { error: "Status é obrigatório e deve ser uma string" },
        { status: 400 }
      );
    }

    const atualizado = await prisma.fila.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(atualizado);
  } catch (err) {
    console.error("Erro ao atualizar:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
