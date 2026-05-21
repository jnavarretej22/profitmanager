import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCoachAutenticado, errorResponse } from "@/lib/plan-guard"

// GET /api/alumnos/[id]/adherencia?dias=7
// Devuelve adherencia (rutina + comidas) del alumno en los últimos N días.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { coach, error } = await getCoachAutenticado()
  if (error) return error

  const dias = Math.min(Math.max(parseInt(new URL(req.url).searchParams.get("dias") ?? "7", 10) || 7, 1), 90)

  const alumno = await prisma.alumno.findFirst({
    where: { id, coach_id: coach!.id, deleted_at: null },
    select: { id: true },
  })
  if (!alumno) return errorResponse("NO_ENCONTRADO", "Alumno no encontrado", 404)

  const hoy   = new Date()
  hoy.setHours(12, 0, 0, 0)
  const desde = new Date(hoy)
  desde.setDate(hoy.getDate() - (dias - 1))

  const [sesiones, comidas] = await Promise.all([
    prisma.sesionRutinaLog.findMany({
      where:  { alumno_id: alumno.id, fecha: { gte: desde, lte: hoy } },
      include: {
        dia_rutina: { select: { dia_semana: true, nombre_foco: true, es_descanso: true } },
      },
      orderBy: { fecha: "desc" },
    }),
    prisma.comidaLog.findMany({
      where:  { alumno_id: alumno.id, fecha: { gte: desde, lte: hoy } },
      include: {
        comida_plan: { select: { momento: true, descripcion: true } },
      },
      orderBy: { fecha: "desc" },
    }),
  ])

  // Días esperados: suma de días no-descanso entre TODAS las rutinas activas
  // (un alumno puede tener varias rutinas en paralelo, ej. fuerza L/J + cardio M/V)
  const rutinasActivas = await prisma.rutina.findMany({
    where:   { alumno_id: alumno.id, activa: true, deleted_at: null },
    include: { dias: { where: { es_descanso: false }, select: { dia_semana: true } } },
  })

  // Comidas esperadas por día del plan activo
  const planActivo = await prisma.planAlimenticio.findFirst({
    where:   { alumno_id: alumno.id, activo: true, deleted_at: null },
    include: {
      dias: {
        where: { es_libre: false },
        include: { comidas: { select: { id: true } } },
      },
    },
  })

  // Para cada día calendario, contamos cuántas rutinas activas tienen
  // ese día como entrenamiento. Ej: si hoy es lunes y tienes fuerza+cardio
  // ambas en lunes, las sesiones esperadas para hoy son 2.
  const ORDEN_DIAS = ["lunes","martes","miercoles","jueves","viernes","sabado","domingo"]
  const conteoPorDia = new Map<string, number>()
  for (const r of rutinasActivas) {
    for (const d of r.dias) {
      conteoPorDia.set(d.dia_semana, (conteoPorDia.get(d.dia_semana) ?? 0) + 1)
    }
  }

  let sesionesEsperadas = 0
  for (let i = 0; i < dias; i++) {
    const d   = new Date(desde)
    d.setDate(desde.getDate() + i)
    const idx = d.getDay() === 0 ? 6 : d.getDay() - 1
    const dia = ORDEN_DIAS[idx]
    sesionesEsperadas += conteoPorDia.get(dia) ?? 0
  }

  // Comidas esperadas: para cada día del rango, ver cuántas comidas tenía ese día del plan
  let comidasEsperadas = 0
  if (planActivo) {
    const comidasPorDia = new Map<string, number>()
    for (const d of planActivo.dias) {
      comidasPorDia.set(d.dia_semana, d.comidas.length)
    }
    for (let i = 0; i < dias; i++) {
      const d   = new Date(desde)
      d.setDate(desde.getDate() + i)
      const idx = d.getDay() === 0 ? 6 : d.getDay() - 1
      comidasEsperadas += comidasPorDia.get(ORDEN_DIAS[idx]) ?? 0
    }
  }

  const sesionesCompletadas = sesiones.filter((s) => s.estado === "completada").length
  const sesionesParciales   = sesiones.filter((s) => s.estado === "parcial").length
  const sesionesSaltadas    = sesiones.filter((s) => s.estado === "no_realizada").length
  const comidasCumplidas    = comidas.filter((c) => c.cumplida).length

  return NextResponse.json({
    dias,
    rango: { desde: desde.toISOString().slice(0, 10), hasta: hoy.toISOString().slice(0, 10) },
    rutina: {
      esperadas: sesionesEsperadas,
      completadas: sesionesCompletadas,
      parciales: sesionesParciales,
      saltadas: sesionesSaltadas,
      pct: sesionesEsperadas > 0 ? Math.round((sesionesCompletadas / sesionesEsperadas) * 100) : null,
    },
    comidas: {
      esperadas: comidasEsperadas,
      cumplidas: comidasCumplidas,
      pct: comidasEsperadas > 0 ? Math.round((comidasCumplidas / comidasEsperadas) * 100) : null,
    },
    logs_sesiones: sesiones.map((s) => ({
      id: s.id,
      fecha: s.fecha.toISOString().slice(0, 10),
      estado: s.estado,
      energia: s.energia,
      notas: s.notas,
      dia_semana: s.dia_rutina.dia_semana,
      nombre_foco: s.dia_rutina.nombre_foco,
    })),
    logs_comidas: comidas.map((c) => ({
      id: c.id,
      fecha: c.fecha.toISOString().slice(0, 10),
      cumplida: c.cumplida,
      notas: c.notas,
      momento: c.comida_plan.momento,
      descripcion: c.comida_plan.descripcion,
    })),
  })
}
