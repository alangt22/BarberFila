import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";



export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  try {
    const barbeiroEmail = session?.user?.email;

    const barbeiro = await prisma.usuario.findUnique({
      where: { email: barbeiroEmail || "" },
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
    });

    return NextResponse.json(fila);
  } catch (error) {
    console.error("Erro no endpoint /api/fila", error);
    return NextResponse.json({ error: "Erro ao buscar fila" }, { status: 500 });
  }
}
