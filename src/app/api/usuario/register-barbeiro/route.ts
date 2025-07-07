// app/api/usuario/registrar-barbeiro/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyIdToken } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1]

    if (!token) return NextResponse.json({ error: 'Token ausente' }, { status: 401 })

    const decoded = await verifyIdToken(token)
    const { nome, email } = await req.json()

    let usuario = await prisma.usuario.findUnique({
      where: { firebaseId: decoded.uid },
    })

    if (!usuario) {
      usuario = await prisma.usuario.create({
        data: {
          firebaseId: decoded.uid,
          nome,
          
          role: 'barbeiro',
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erro ao registrar barbeiro:', err)
    return NextResponse.json({ error: 'Erro interno ao registrar barbeiro' }, { status: 500 })
  }
}
