import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

const schema = z.object({
  password_actual: z.string().min(1),
  password_nueva: z.string().min(6, "Mínimo 6 caracteres"),
})

// POST /api/alumno/cambiar-password
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "alumno") {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "DATOS_INVALIDOS", mensaje: "Contraseña nueva debe tener mínimo 6 caracteres" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password_hash: true },
  })
  if (!user) return NextResponse.json({ error: "NO_ENCONTRADO" }, { status: 404 })

  const correcto = await bcrypt.compare(parsed.data.password_actual, user.password_hash)
  if (!correcto) {
    return NextResponse.json({ error: "CREDENCIALES_INVALIDAS", mensaje: "La contraseña actual no es correcta" }, { status: 400 })
  }

  const nuevo_hash = await bcrypt.hash(parsed.data.password_nueva, 12)
  await prisma.user.update({ where: { id: session.user.id }, data: { password_hash: nuevo_hash } })

  return NextResponse.json({ ok: true })
}
