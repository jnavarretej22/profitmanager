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

  const rutina = await prisma.rutina.findUnique({
    where: { id },
    include: {
      dias: {
        orderBy: { orden: "asc" },
        include: { ejercicios: { orderBy: { orden: "asc" } } },
      },
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

  if (session.user.role === "admin") {
    return NextResponse.json({ error: "NO_ENCONTRADA" }, { status: 404 })
  }
  if (session.user.role === "coach" && rutina.coach_id !== session.user.coachId) {
    return NextResponse.json({ error: "NO_ENCONTRADA" }, { status: 404 })
  }
  if (session.user.role === "alumno") {
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
      duracion_minutos: rutina.duracion_minutos,
      dias: rutina.dias.map((d) => ({
        dia_semana:  d.dia_semana,
        nombre_foco: d.nombre_foco,
        es_descanso: d.es_descanso,
        orden:       d.orden,
        ejercicios:  d.ejercicios.map((e) => ({
          orden:             e.orden,
          nombre:            e.nombre,
          series:            e.series ?? 3,
          repeticiones:      e.repeticiones ?? "10",
          peso_kg:           e.peso_kg ? e.peso_kg.toString() : null,
          descanso_segundos: e.descanso_segundos ?? 60,
          rpe:               e.rpe,
          progresion:        e.progresion,
          notas:             e.notas,
        })),
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
