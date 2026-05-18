import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { PlanFeatureService } from "@/lib/plan-features"

type Metrica = "peso" | "cintura" | "cadera" | "pecho" | "brazo" | "pierna" | "porcentaje_grasa"
const METRICAS_VALIDAS: Metrica[] = ["peso", "cintura", "cadera", "pecho", "brazo", "pierna", "porcentaje_grasa"]

// GET /api/alumnos/[id]/progreso/grafica?metrica=peso&desde=YYYY-MM-DD
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })

  const { id: alumnoId } = await params
  const sp = req.nextUrl.searchParams
  const metrica = (sp.get("metrica") ?? "peso") as Metrica
  const desde   = sp.get("desde") // YYYY-MM-DD opcional

  if (!METRICAS_VALIDAS.includes(metrica)) {
    return NextResponse.json({ error: "METRICA_INVALIDA" }, { status: 400 })
  }

  // Resolver acceso: primero verificar pertenencia (antes de feature, para no filtrar existencia)
  let coachId: string | null = null

  if (session.user.role === "coach") {
    coachId = session.user.coachId ?? null
    if (!coachId) return NextResponse.json({ error: "SIN_COACH" }, { status: 403 })
    // Verificar pertenencia antes del feature check (regla 6.5 CLAUDE.md: 404 si no pertenece)
    const alumno = await prisma.alumno.findFirst({ where: { id: alumnoId, coach_id: coachId } })
    if (!alumno) return NextResponse.json({ error: "NO_ENCONTRADO" }, { status: 404 })
  } else if (session.user.role === "alumno") {
    // El alumno solo puede ver su propio progreso
    const alumno = await prisma.alumno.findUnique({
      where: { id: alumnoId },
      select: { coach: { select: { id: true, plan_actual: true } }, user_id: true },
    })
    if (!alumno || alumno.user_id !== session.user.id) {
      return NextResponse.json({ error: "NO_ENCONTRADO" }, { status: 404 })
    }
    coachId = alumno.coach.id
  } else {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 403 })
  }

  // Verificar feature graficas_progreso DESPUÉS de confirmar pertenencia
  const coachData = await prisma.coach.findUnique({ where: { id: coachId }, select: { plan_actual: true } })
  const tieneGraficas = PlanFeatureService.tieneFeature(coachData?.plan_actual ?? "gratis", "graficas_progreso")
  if (!tieneGraficas) {
    return NextResponse.json({ error: "FEATURE_NOT_AVAILABLE" }, { status: 403 })
  }

  // Construir where con filtro de fecha opcional
  const where: Record<string, unknown> = { alumno_id: alumnoId }
  if (desde) {
    where.fecha = { gte: new Date(desde) }
  }

  const mediciones = await prisma.medicion.findMany({
    where,
    orderBy: { fecha: "asc" },
    select: {
      fecha: true,
      peso_kg: true,
      cintura_cm: true,
      cadera_cm: true,
      pecho_cm: true,
      brazo_cm: true,
      pierna_cm: true,
      porcentaje_grasa: true,
    },
  })

  // Mapear al formato que espera Recharts
  const campoDb: Record<Metrica, string> = {
    peso:             "peso_kg",
    cintura:          "cintura_cm",
    cadera:           "cadera_cm",
    pecho:            "pecho_cm",
    brazo:            "brazo_cm",
    pierna:           "pierna_cm",
    porcentaje_grasa: "porcentaje_grasa",
  }

  const datos = mediciones.map((m) => ({
    fecha: m.fecha.toISOString().split("T")[0],
    valor: m[campoDb[metrica] as keyof typeof m] !== null
      ? Number(m[campoDb[metrica] as keyof typeof m])
      : null,
  })).filter((d) => d.valor !== null)

  // Para multi-serie (todas las métricas de medidas corporales)
  const multiSerie = mediciones.map((m) => ({
    fecha:   m.fecha.toISOString().split("T")[0],
    cintura: m.cintura_cm  !== null ? Number(m.cintura_cm)  : null,
    cadera:  m.cadera_cm   !== null ? Number(m.cadera_cm)   : null,
    pecho:   m.pecho_cm    !== null ? Number(m.pecho_cm)    : null,
    brazo:   m.brazo_cm    !== null ? Number(m.brazo_cm)    : null,
    pierna:  m.pierna_cm   !== null ? Number(m.pierna_cm)   : null,
  }))

  return NextResponse.json({ datos, multiSerie })
}
