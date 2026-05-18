import { NextResponse } from "next/server"
import { auth } from "./auth"
import { prisma } from "./db"
import { PlanFeatureService, type Feature } from "./plan-features"

type ErrorCode =
  | "NO_AUTORIZADO"
  | "PLAN_LIMIT_REACHED"
  | "READ_ONLY_MODE"
  | "FEATURE_NOT_AVAILABLE"
  | "NO_ENCONTRADO"
  | "DATOS_INVALIDOS"

export function errorResponse(code: ErrorCode, mensaje: string, status: number) {
  return NextResponse.json({ error: code, mensaje }, { status })
}

// Obtiene el coach autenticado o retorna error
export async function getCoachAutenticado() {
  const session = await auth()
  if (!session || session.user.role !== "coach" || !session.user.coachId) {
    return { coach: null, error: errorResponse("NO_AUTORIZADO", "No autorizado", 401) }
  }

  const coach = await prisma.coach.findUnique({
    where: { id: session.user.coachId },
    select: { id: true, plan_actual: true, estado_plan: true },
  })

  if (!coach) {
    return { coach: null, error: errorResponse("NO_AUTORIZADO", "Coach no encontrado", 401) }
  }

  return { coach, error: null }
}

// Valida que el coach no esté en modo solo lectura
export function requireModoActivo(coach: { estado_plan: string }) {
  if (coach.estado_plan === "solo_lectura") {
    return errorResponse(
      "READ_ONLY_MODE",
      "Tu plan está vencido. No puedes crear ni editar datos.",
      403
    )
  }
  return null
}

// Valida que el coach tenga una feature
export function requireFeature(coach: { plan_actual: string }, feature: Feature) {
  const tiene = PlanFeatureService.tieneFeature(coach.plan_actual as never, feature)
  if (!tiene) {
    return errorResponse(
      "FEATURE_NOT_AVAILABLE",
      "Esta función no está disponible en tu plan actual.",
      403
    )
  }
  return null
}

// Valida que el coach pueda agregar un alumno más
export async function requireLimiteAlumnos(coachId: string, planActual: string) {
  const total = await prisma.alumno.count({ where: { coach_id: coachId, activo: true } })
  const limite = PlanFeatureService.limiteAlumnos(planActual as never)
  if (total >= limite) {
    return errorResponse(
      "PLAN_LIMIT_REACHED",
      `Alcanzaste el límite de ${limite} alumnos de tu plan. Actualiza para agregar más.`,
      403
    )
  }
  return null
}
