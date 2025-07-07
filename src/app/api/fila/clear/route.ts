import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyIdToken } from "@/lib/firebase-admin"

export async function DELETE(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1]
  if (!token) return NextResponse.json({ error: "No token" }, { status: 401 })

  const decoded = await verifyIdToken(token)
  if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

  try {
    // Contar quantos itens serão excluídos
    const count = await prisma.fila.count()

    if (count === 0) {
      return NextResponse.json({
        success: true,
        message: "Queue is already empty",
        deletedCount: 0,
      })
    }

    // Buscar todos os usuários que estão na fila para excluí-los também
    const filaItems = await prisma.fila.findMany({
      include: { usuario: true },
    })

    // Excluir todos os itens da fila primeiro (devido às foreign keys)
    await prisma.fila.deleteMany({})

    // Excluir todos os usuários que estavam na fila
    const usuarioIds = filaItems.map((item) => item.usuarioId).filter(Boolean)

    if (usuarioIds.length > 0) {
      await prisma.usuario.deleteMany({
        where: {
          id: { in: usuarioIds },
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `Queue and users cleared successfully. ${count} items deleted.`,
      deletedCount: count,
      deletedUsers: usuarioIds.length,
    })
  } catch (error) {
    console.error("Error clearing queue:", error)
    return NextResponse.json({ error: "Failed to clear queue" }, { status: 500 })
  }
}
