import { type NextRequest, NextResponse } from "next/server"
import { auth } from "firebase-admin"
import { initializeApp, getApps, cert } from "firebase-admin/app"
import { prisma } from "@/lib/prisma" // Declare the prisma variable

// Inicializar Firebase Admin (ajuste conforme sua configuração)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  })
}

export async function POST(request: NextRequest) {
  try {
    const { firebaseUid } = await request.json()
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const token = authHeader.split("Bearer ")[1]

    // Verificar token Firebase
    const decodedToken = await auth().verifyIdToken(token)

    if (decodedToken.uid !== firebaseUid) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // Buscar usuário no banco Prisma usando o firebaseUid
    const user = await prisma.usuario.findUnique({
      where: {
        firebaseId: firebaseUid,
      },
      select: {
        id: true,
        nome: true,
        role: true,
        // outros campos que você quiser retornar
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Erro ao buscar perfil do usuário:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
