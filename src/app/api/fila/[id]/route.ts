import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const idNumber = Number(context.params.id)


  if (isNaN(idNumber)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  try {
    const { status } = await req.json()

    if (!status) {
      return NextResponse.json({ error: 'Status é obrigatório' }, { status: 400 })
    }

    const itemAtualizado = await prisma.fila.update({
      where: { id: idNumber },
      data: { status },
    })

    return NextResponse.json(itemAtualizado)
  } catch (error) {
    console.error('Erro ao atualizar status:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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

    // Deleta o usuário vinculado
    if (item.usuario?.id) {
      await prisma.usuario.delete({ where: { id: item.usuario.id } })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Erro ao excluir:', error)
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 })
  }
}
