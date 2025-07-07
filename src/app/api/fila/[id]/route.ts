import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyIdToken } from "@/lib/firebase-admin"

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.headers.get("Authorization")?.split(" ")[1]
  if (!token) return NextResponse.json({ error: "No token" }, { status: 401 })

  const decoded = await verifyIdToken(token)
  if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

  const itemId = Number.parseInt(params.id)
  if (isNaN(itemId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
  }

  try {
    // Verificar se o item existe
    const itemExists = await prisma.fila.findUnique({
      where: { id: itemId },
    })

    if (!itemExists) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Excluir o item
    const deletedItem = await prisma.fila.delete({
      where: { id: itemId },
    })

    // excluir o usuário associado, se necessário
    if (deletedItem.usuarioId) {
      await prisma.usuario.delete({
        where: { id: deletedItem.usuarioId },
      })
    }

    return NextResponse.json({
      success: true,
      message: "Item deleted successfully",
      deletedItem,
    })
  } catch (error) {
    console.error("Error deleting item:", error)
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 })
  }
}
