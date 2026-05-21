import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { renderToBuffer } from "@react-pdf/renderer"
import React from "react"
import { PlanAlimenticioPDF } from "@/lib/pdf/PlanAlimenticioPDF"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })

  const { id } = await params

  const plan = await prisma.planAlimenticio.findUnique({
    where: { id },
    include: {
      dias: {
        orderBy: { orden: "asc" },
        include: { comidas: { orderBy: { orden: "asc" } } },
      },
      coach: {
        include: { user: { select: { nombre: true, apellido: true } } },
      },
      alumno: {
        include: { user: { select: { nombre: true, apellido: true } } },
      },
    },
  })

  if (!plan) return NextResponse.json({ error: "NO_ENCONTRADO" }, { status: 404 })

  if (session.user.role === "admin") {
    return NextResponse.json({ error: "NO_ENCONTRADO" }, { status: 404 })
  }
  if (session.user.role === "coach" && plan.coach_id !== session.user.coachId) {
    return NextResponse.json({ error: "NO_ENCONTRADO" }, { status: 404 })
  }
  if (session.user.role === "alumno") {
    if (!plan.alumno_id || plan.alumno?.user_id !== session.user.id) {
      return NextResponse.json({ error: "NO_ENCONTRADO" }, { status: 404 })
    }
  }

  const marcaAgua = plan.coach.plan_actual === "gratis"
  const alumnoNombre = plan.alumno
    ? { nombre: plan.alumno.user.nombre, apellido: plan.alumno.user.apellido }
    : { nombre: "—", apellido: "" }

  const fechaGenerado = new Date().toLocaleDateString("es-EC", {
    day: "numeric", month: "long", year: "numeric",
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = React.createElement(PlanAlimenticioPDF as any, {
    plan: {
      nombre:            plan.nombre,
      objetivo:          plan.objetivo,
      calorias_objetivo: plan.calorias_objetivo,
      dias: plan.dias.map((d) => ({
        dia_semana:  d.dia_semana,
        nombre_foco: d.nombre_foco,
        es_libre:    d.es_libre,
        comidas: d.comidas.map((c) => ({
          momento:         c.momento,
          hora_sugerida:   c.hora_sugerida ? String(c.hora_sugerida) : null,
          descripcion:     c.descripcion,
          calorias:        c.calorias,
          proteinas_g:     c.proteinas_g,
          carbohidratos_g: c.carbohidratos_g,
          grasas_g:        c.grasas_g,
        })),
      })),
    },
    alumno:        alumnoNombre,
    coach:         { nombre: plan.coach.user.nombre, apellido: plan.coach.user.apellido, logo_url: plan.coach.logo_url },
    marcaAgua,
    fechaGenerado,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(doc as any)
  const nombre = `plan-${plan.nombre.toLowerCase().replace(/\s+/g, "-")}.pdf`

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Cache-Control":       "no-store",
    },
  })
}
