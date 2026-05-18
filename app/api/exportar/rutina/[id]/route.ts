import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { renderToBuffer } from "@react-pdf/renderer"
import React from "react"
import { RutinaPDF } from "@/lib/pdf/RutinaPDF"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })

  const { id } = await params

  // Acceso: coach propietario o alumno asignado
  const rutina = await prisma.rutina.findUnique({
    where: { id },
    include: {
      ejercicios: { orderBy: { orden: "asc" } },
      coach: {
        include: {
          user: { select: { nombre: true, apellido: true } },
        },
      },
      alumno: {
        include: { user: { select: { nombre: true, apellido: true } } },
      },
    },
  })

  if (!rutina) return NextResponse.json({ error: "NO_ENCONTRADA" }, { status: 404 })

  // Verificar permisos (multi-tenant estricto — admin no tiene acceso a PDFs de coaches)
  if (session.user.role === "admin") {
    return NextResponse.json({ error: "NO_ENCONTRADA" }, { status: 404 })
  }
  if (session.user.role === "coach" && rutina.coach_id !== session.user.coachId) {
    return NextResponse.json({ error: "NO_ENCONTRADA" }, { status: 404 })
  }
  if (session.user.role === "alumno") {
    // 404 para no filtrar existencia (regla CLAUDE.md 6.5)
    if (!rutina.alumno_id || rutina.alumno?.user_id !== session.user.id) {
      return NextResponse.json({ error: "NO_ENCONTRADA" }, { status: 404 })
    }
  }

  const marcaAgua = rutina.coach.plan_actual === "gratis"
  const alumnoNombre = rutina.alumno
    ? { nombre: rutina.alumno.user.nombre, apellido: rutina.alumno.user.apellido }
    : { nombre: "—", apellido: "" }

  const fechaGenerado = new Date().toLocaleDateString("es-EC", {
    day: "numeric", month: "long", year: "numeric",
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = React.createElement(RutinaPDF as any, {
    rutina: {
      nombre:           rutina.nombre,
      descripcion:      rutina.descripcion,
      objetivo:         rutina.objetivo,
      dias_semana:      rutina.dias_semana,
      duracion_minutos: rutina.duracion_minutos,
      ejercicios:       rutina.ejercicios.map((e) => ({
        orden:             e.orden,
        nombre:            e.nombre,
        series:            e.series ?? 3,
        repeticiones:      e.repeticiones ?? "10",
        descanso_segundos: e.descanso_segundos ?? 60,
        rpe:               e.rpe,
        notas:             e.notas,
      })),
    },
    alumno: alumnoNombre,
    coach: {
      nombre:   rutina.coach.user.nombre,
      apellido: rutina.coach.user.apellido,
      logo_url: rutina.coach.logo_url,
    },
    marcaAgua,
    fechaGenerado,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(doc as any)
  const nombre = `rutina-${rutina.nombre.toLowerCase().replace(/\s+/g, "-")}.pdf`

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Cache-Control":       "no-store",
    },
  })
}
