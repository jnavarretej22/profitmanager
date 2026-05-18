import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCoachAutenticado, requireFeature, errorResponse } from "@/lib/plan-guard"
import type { Objetivo } from "@prisma/client"

// GET /api/rutinas/templates — templates del sistema (requiere plan Inicial)
export async function GET(req: NextRequest) {
  const { coach, error } = await getCoachAutenticado()
  if (error) return error

  const featErr = requireFeature(coach!, "templates_rutinas")
  if (featErr) return featErr

  const { searchParams } = new URL(req.url)
  const objetivo = searchParams.get("objetivo")

  const templates = await prisma.rutina.findMany({
    where: {
      es_template: true,
      coach_id: null as never, // templates del sistema: sin coach_id
      deleted_at: null,
      activa: true,
      ...(objetivo ? { objetivo: objetivo as Objetivo } : {}),
    },
    include: { ejercicios: { orderBy: { orden: "asc" } } },
    orderBy: { nombre: "asc" },
  })

  return NextResponse.json({ templates })
}
