import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getAlumnoAutenticado } from "@/lib/alumno-guard"
import { errorResponse } from "@/lib/plan-guard"

const upsertSchema = z.object({
  dia_rutina_id: z.string().uuid(),
  fecha:         z.string().date(),
  estado:        z.enum(["completada", "parcial", "no_realizada"]),
  energia:       z.number().int().min(1).max(5).optional().nullable(),
  notas:         z.string().max(1000).optional().nullable(),
})

// POST /api/alumno/sesiones-rutina — upsert log de sesión
export async function POST(req: NextRequest) {
  const { alumno, error } = await getAlumnoAutenticado()
  if (error) return error

  const body   = await req.json()
  const parsed = upsertSchema.safeParse(body)
  if (!parsed.success) return errorResponse("DATOS_INVALIDOS", "Datos inválidos", 400)

  const { dia_rutina_id, fecha, estado, energia, notas } = parsed.data

  // Verificar que el dia_rutina pertenezca a una rutina asignada al alumno
  const diaRutina = await prisma.diaRutina.findFirst({
    where: {
      id:     dia_rutina_id,
      rutina: { alumno_id: alumno!.id, deleted_at: null },
    },
    select: { id: true },
  })
  if (!diaRutina) return errorResponse("NO_ENCONTRADO", "Día no encontrado", 404)

  const fechaDate = new Date(fecha + "T12:00:00")

  const log = await prisma.sesionRutinaLog.upsert({
    where: {
      alumno_id_dia_rutina_id_fecha: {
        alumno_id:     alumno!.id,
        dia_rutina_id,
        fecha:         fechaDate,
      },
    },
    create: {
      alumno_id:     alumno!.id,
      dia_rutina_id,
      fecha:         fechaDate,
      estado,
      energia:       energia ?? null,
      notas:         notas ?? null,
    },
    update: {
      estado,
      energia: energia ?? null,
      notas:   notas ?? null,
    },
  })

  return NextResponse.json({ ok: true, log })
}

// DELETE /api/alumno/sesiones-rutina?dia_rutina_id=...&fecha=YYYY-MM-DD
export async function DELETE(req: NextRequest) {
  const { alumno, error } = await getAlumnoAutenticado()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const dia_rutina_id    = searchParams.get("dia_rutina_id")
  const fecha            = searchParams.get("fecha")

  if (!dia_rutina_id || !fecha) {
    return errorResponse("DATOS_INVALIDOS", "Faltan parámetros", 400)
  }

  await prisma.sesionRutinaLog.deleteMany({
    where: {
      alumno_id:     alumno!.id,
      dia_rutina_id,
      fecha:         new Date(fecha + "T12:00:00"),
    },
  })

  return NextResponse.json({ ok: true })
}
