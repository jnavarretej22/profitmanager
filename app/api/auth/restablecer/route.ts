import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

const schema = z.object({
  token:            z.string().min(1),
  password_nueva:   z.string().min(6, "Mínimo 6 caracteres"),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "DATOS_INVALIDOS", mensaje: "La contraseña debe tener mínimo 6 caracteres." },
      { status: 400 }
    )
  }

  const { token, password_nueva } = parsed.data

  const tokenRecord = await prisma.tokenVerificacion.findUnique({
    where: { token },
    select: { id: true, user_id: true, tipo: true, expira_en: true, usado: true },
  })

  if (!tokenRecord || tokenRecord.tipo !== "reset_password" || tokenRecord.usado) {
    return NextResponse.json(
      { error: "TOKEN_INVALIDO", mensaje: "El enlace no es válido o ya fue utilizado." },
      { status: 400 }
    )
  }

  if (new Date() > tokenRecord.expira_en) {
    return NextResponse.json(
      { error: "TOKEN_EXPIRADO", mensaje: "El enlace expiró. Solicita uno nuevo." },
      { status: 400 }
    )
  }

  const nuevo_hash = await bcrypt.hash(password_nueva, 12)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: tokenRecord.user_id },
      data:  { password_hash: nuevo_hash, email_verificado: true },
    }),
    prisma.tokenVerificacion.update({
      where: { id: tokenRecord.id },
      data:  { usado: true },
    }),
  ])

  return NextResponse.json({ ok: true })
}
