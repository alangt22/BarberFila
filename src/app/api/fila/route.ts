// fila/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.split(' ')[1]
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })

  await verifyIdToken(token) // só para validar o token, pode remover se quiser liberar geral

  const fila = await prisma.fila.findMany({
    orderBy: { horaEntrada: 'asc' },
    include: {
      usuario: true, // inclui os dados do usuário
    },
  })

  return NextResponse.json(fila)
}
