import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const { status } = await req.json()

  if (!status) {
    return NextResponse.json({ error: 'Status obrigatório' }, { status: 400 })
  }

  try {
    const updated = await prisma.fila.update({
      where: { id: Number(id) },
      data: { status },
    })

    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }
}
