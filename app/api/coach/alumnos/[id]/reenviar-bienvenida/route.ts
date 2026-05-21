import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { enviarEmail } from "@/lib/email"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user.coachId) {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const { id } = await params

  const alumno = await prisma.alumno.findFirst({
    where: { id, coach_id: session.user.coachId, deleted_at: null },
    select: {
      user: { select: { nombre: true, email: true, email_verificado: true, password_hash: true } },
    },
  })

  if (!alumno) return NextResponse.json({ error: "NO_ENCONTRADO" }, { status: 404 })

  if (alumno.user.email_verificado || alumno.user.password_hash !== null) {
    return NextResponse.json(
      { error: "YA_ACTIVADO", mensaje: "Este alumno ya activó su cuenta." },
      { status: 409 }
    )
  }

  const coachUser = await prisma.user.findFirst({
    where: { coach: { id: session.user.coachId } },
    select: { nombre: true },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

  await enviarEmail(alumno.user.email, {
    tipo: "bienvenida-alumno",
    data: {
      nombreAlumno: alumno.user.nombre,
      nombreCoach:  coachUser?.nombre ?? "Tu coach",
      email:        alumno.user.email,
      linkLogin:    `${baseUrl}/login`,
    },
  })

  return NextResponse.json({ ok: true })
}
