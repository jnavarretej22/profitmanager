import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getCoachAutenticado, requireModoActivo, errorResponse } from "@/lib/plan-guard"

const editarAlumnoSchema = z.object({
  nombre: z.string().min(2).max(100).optional(),
  apellido: z.string().min(2).max(100).optional(),
  telefono: z.string().optional(),
  identificacion: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  genero: z.enum(["M", "F", "otro"]).optional(),
  altura_cm: z.number().int().positive().optional(),
  peso_inicial_kg: z.number().positive().optional(),
  objetivo: z.enum(["hipertrofia", "perdida_grasa", "fuerza", "resistencia", "general"]).optional(),
  fecha_inicio: z.string().optional(),
  notas_medicas: z.string().optional(),
  activo: z.boolean().optional(),
})

async function verificarPertenencia(coachId: string, alumnoId: string) {
  const alumno = await prisma.alumno.findFirst({
    where: { id: alumnoId, coach_id: coachId, deleted_at: null },
  })
  return alumno
}

// GET /api/alumnos/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { coach, error } = await getCoachAutenticado()
  if (error) return error

  const alumno = await prisma.alumno.findFirst({
    where: { id, coach_id: coach!.id, deleted_at: null },
    include: {
      user: { select: { nombre: true, apellido: true, email: true, telefono: true } },
      mediciones: { orderBy: { fecha: "desc" } },
      rutinas: {
        where: { activa: true, deleted_at: null },
        include: { ejercicios: { orderBy: { orden: "asc" } } },
        take: 1,
      },
      planes_alimenticios: {
        where: { activo: true, deleted_at: null },
        include: { comidas: { orderBy: { momento: "asc" } } },
        take: 1,
      },
    },
  })

  if (!alumno) return errorResponse("NO_ENCONTRADO", "Alumno no encontrado", 404)

  return NextResponse.json({ alumno })
}

// PATCH /api/alumnos/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { coach, error } = await getCoachAutenticado()
  if (error) return error

  const modoError = requireModoActivo(coach!)
  if (modoError) return modoError

  const alumno = await verificarPertenencia(coach!.id, id)
  if (!alumno) return errorResponse("NO_ENCONTRADO", "Alumno no encontrado", 404)

  const body = await req.json()
  const parsed = editarAlumnoSchema.safeParse(body)
  if (!parsed.success) return errorResponse("DATOS_INVALIDOS", "Datos inválidos", 400)

  const {
    nombre, apellido, telefono, identificacion, fecha_nacimiento,
    genero, altura_cm, peso_inicial_kg, objetivo, fecha_inicio,
    notas_medicas, activo,
  } = parsed.data

  // Actualizar user si hay campos de usuario
  if (nombre || apellido || telefono) {
    await prisma.user.update({
      where: { id: alumno.user_id },
      data: {
        ...(nombre && { nombre }),
        ...(apellido && { apellido }),
        ...(telefono !== undefined && { telefono }),
      },
    })
  }

  const alumnoActualizado = await prisma.alumno.update({
    where: { id },
    data: {
      ...(identificacion !== undefined && { identificacion }),
      ...(fecha_nacimiento && { fecha_nacimiento: new Date(fecha_nacimiento) }),
      ...(genero && { genero: genero as never }),
      ...(altura_cm && { altura_cm }),
      ...(peso_inicial_kg && { peso_inicial_kg }),
      ...(objetivo && { objetivo: objetivo as never }),
      ...(fecha_inicio && { fecha_inicio: new Date(fecha_inicio) }),
      ...(notas_medicas !== undefined && { notas_medicas }),
      ...(activo !== undefined && { activo }),
    },
    include: {
      user: { select: { nombre: true, apellido: true, email: true } },
    },
  })

  return NextResponse.json({ ok: true, alumno: alumnoActualizado })
}

// DELETE /api/alumnos/[id] — soft delete (archivar)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { coach, error } = await getCoachAutenticado()
  if (error) return error

  const modoError = requireModoActivo(coach!)
  if (modoError) return modoError

  const alumno = await verificarPertenencia(coach!.id, id)
  if (!alumno) return errorResponse("NO_ENCONTRADO", "Alumno no encontrado", 404)

  // Soft delete: archivar (activo=false + deleted_at)
  await prisma.alumno.update({
    where: { id },
    data: { activo: false, deleted_at: new Date() },
  })

  return NextResponse.json({ ok: true })
}
