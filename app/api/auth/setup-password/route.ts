import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

const setupSchema = z.object({
  email:    z.string().email().toLowerCase(),
  password: z.string().min(8, "Mínimo 8 caracteres").max(128),
})

// POST /api/auth/setup-password
// Permite que un usuario sin contraseña (password_hash=null) configure la suya
// en su primer ingreso. Después de esto puede usar /api/auth/[...nextauth] normalmente.
export async function POST(req: NextRequest) {
  const body   = await req.json().catch(() => null)
  const parsed = setupSchema.safeParse(body)

  if (!parsed.success) {
    const primero = parsed.error?.issues?.[0]
    return NextResponse.json(
      { error: "DATOS_INVALIDOS", mensaje: primero?.message ?? "Datos inválidos" },
      { status: 400 },
    )
  }

  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({
    where:  { email },
    select: { id: true, password_hash: true, activo: true, deleted_at: true },
  })

  // Genérico para no filtrar si el email existe o no
  if (!user || !user.activo || user.deleted_at !== null) {
    return NextResponse.json(
      { error: "NO_CONFIGURABLE", mensaje: "No se puede configurar esta cuenta." },
      { status: 400 },
    )
  }

  // Solo se permite si NUNCA configuró contraseña. Si ya tiene una,
  // debe usar el flujo normal de login o "recuperar contraseña".
  if (user.password_hash !== null) {
    return NextResponse.json(
      { error: "YA_CONFIGURADA", mensaje: "Esta cuenta ya tiene contraseña. Inicia sesión normalmente." },
      { status: 409 },
    )
  }

  const password_hash = await bcrypt.hash(password, 12)

  await prisma.user.update({
    where: { id: user.id },
    data:  {
      password_hash,
      email_verificado: true,
    },
  })

  return NextResponse.json({ ok: true })
}
