// src/app/api/fila/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyIdToken } from '@/lib/firebase-admin'

export async function PATCH(req: NextRequest) {
  const token = req.headers.get('Authorization')?.split(' ')[1]
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })

  const decoded = await verifyIdToken(token)
  if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const { id, status } = await req.json()

  if (!id || !status) {
    return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
  }

  const filaAtualizada = await prisma.fila.update({
    where: { id },
    data: { status },
  })

  return NextResponse.json(filaAtualizada)
}
