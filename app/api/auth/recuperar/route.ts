import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import crypto from "crypto"
import { prisma } from "@/lib/db"
import { enviarEmail } from "@/lib/email"

const schema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    // Respuesta genérica para no filtrar info
    return NextResponse.json({ ok: true })
  }

  const email = parsed.data.email.toLowerCase().trim()

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, nombre: true, activo: true, deleted_at: true, password_hash: true },
  })

  // Siempre retornar ok — no filtrar si el email existe
  if (!user || !user.activo || user.deleted_at !== null || user.password_hash === null) {
    return NextResponse.json({ ok: true })
  }

  // Invalidar tokens anteriores del mismo tipo
  await prisma.tokenVerificacion.updateMany({
    where: { user_id: user.id, tipo: "reset_password", usado: false },
    data:  { usado: true },
  })

  const token = crypto.randomBytes(32).toString("hex")
  const expira_en = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

  await prisma.tokenVerificacion.create({
    data: { user_id: user.id, token, tipo: "reset_password", expira_en },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
  await enviarEmail(email, {
    tipo: "reset-contrasena",
    data: {
      nombre:    user.nombre,
      linkReset: `${baseUrl}/restablecer-contrasena?token=${token}`,
    },
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
