import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyIdToken } from "@/lib/firebase-admin"

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1]
  if (!token) return NextResponse.json({ error: "No token" }, { status: 401 })

  const decoded = await verifyIdToken(token)
  if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

  const { clienteId, nome, telefone } = await req.json()

  if (!clienteId || !telefone) {
    return NextResponse.json({ error: "Missing clienteId or telefone" }, { status: 400 })
  }

  try {
    // Verificar se o cliente existe na fila
    const cliente = await prisma.fila.findUnique({
      where: { id: clienteId },
      include: { usuario: true },
    })

    if (!cliente) {
      return NextResponse.json({ error: "Cliente not found in queue" }, { status: 404 })
    }

    // Limpar o número de telefone (remover caracteres especiais)
    let phoneNumber = telefone.replace(/\D/g, "")

    // Se não começar com 55, adicionar código do Brasil
    if (!phoneNumber.startsWith("55")) {
      phoneNumber = "55" + phoneNumber
    }

    // Mensagem personalizada
    const message = `🔔 *Barbearia - Sua vez chegou!*

Olá ${nome || "cliente"}! 👋

Sua vez na fila chegou! Por favor, dirija-se à barbearia para o seu atendimento.

⏰ *Não perca sua vez!*

Obrigado pela preferência! ✂️`

    // Método 1: WhatsApp Web (wa.me) - Mais confiável
    const whatsappWebUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`

    // Método 2: WhatsApp API Web (alternativo)
    const whatsappApiUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`

    return NextResponse.json({
      success: true,
      message: "WhatsApp links generated successfully",
      data: {
        whatsappWebUrl,
        whatsappApiUrl,
        phoneNumber,
        clienteName: nome,
        messagePreview: message.substring(0, 100) + "...",
      },
      method: "web_link",
    })
  } catch (error) {
    console.error("Error processing WhatsApp notification:", error)
    return NextResponse.json({ error: "Failed to generate WhatsApp link" }, { status: 500 })
  }
}
