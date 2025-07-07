import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { nome, telefone } = await req.json()

    if (!nome || !telefone) {
      return NextResponse.json({ error: 'Nome e telefone são obrigatórios' }, { status: 400 })
    }

    let usuario = await prisma.usuario.findFirst({
      where: { telefone },
    })

    if (!usuario) {
      usuario = await prisma.usuario.create({
        data: {
          firebaseId: '', // TODO: set the correct firebaseId here
          nome,
          telefone,
          role: 'cliente',
        },
      })
    } else {
      usuario = await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          nome: usuario.nome || nome,
        },
      })
    }

    const jaNaFila = await prisma.fila.findFirst({
      where: {
        usuarioId: usuario.id,
        status: 'aguardando',
      },
    })

    if (!jaNaFila) {
      await prisma.fila.create({
        data: {
          usuarioId: usuario.id,
          servico: 'testando',
          status: 'aguardando',
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro ao salvar usuário' }, { status: 500 })
  }
}
