import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Context {
  params: Promise<{ id: string }>
}

export async function DELETE(
  req: Request,
  context: Context
) {
  const params = await context.params
  const id = Number(params.id)

  if (isNaN(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  try {
    // Busca o item da fila com o ID do usuário
    const item = await prisma.fila.findUnique({
      where: { id },
      include: { usuario: true },
    })

    if (!item) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
    }

    // Deleta o item da fila
    await prisma.fila.delete({ where: { id } })

    // Deleta o usuário vinculado, se existir
    if (item.usuario?.id) {
      await prisma.usuario.delete({ where: { id: item.usuario.id } })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Erro ao excluir:', error)
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 })
  }
}
