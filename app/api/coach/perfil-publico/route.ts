import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { validarSlug } from "@/lib/slug"

const ESPECIALIDADES_VALIDAS = [
  "Hipertrofia", "Pérdida de grasa", "Fuerza", "Resistencia",
  "Nutrición deportiva", "Funcional",
]

const schema = z.object({
  slug:                 z.string().min(3).max(80).toLowerCase().trim().optional(),
  perfil_publico_activo:z.boolean().optional(),
  foto_publica_url:     z.string().url().nullable().optional(),
  titulo_profesional:   z.string().max(200).nullable().optional(),
  bio:                  z.string().max(500).nullable().optional(),
  especialidades_tags:  z.array(z.string()).max(4).optional(),
  anios_experiencia:    z.number().int().min(0).max(60).nullable().optional(),
  ciudad:               z.string().max(100).nullable().optional(),
  instagram_url:        z.string().max(200).nullable().optional(),
  cta_whatsapp_texto:   z.string().max(100).nullable().optional(),
  telefono:             z.string().max(30).nullable().optional(), // actualiza users.telefono
})

// GET — leer perfil público actual
export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "coach") {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const coach = await prisma.coach.findUnique({
    where: { id: session.user.coachId ?? "" },
    select: {
      slug: true, perfil_publico_activo: true, foto_publica_url: true,
      titulo_profesional: true, bio: true, especialidades_tags: true,
      anios_experiencia: true, ciudad: true, instagram_url: true,
      cta_whatsapp_texto: true, plan_actual: true,
      user: { select: { nombre: true, apellido: true, telefono: true, pais: true } },
    },
  })

  if (!coach) return NextResponse.json({ error: "NO_ENCONTRADO" }, { status: 404 })

  return NextResponse.json({ coach })
}

// PATCH — guardar perfil público
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "coach") {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const coachActual = await prisma.coach.findUnique({
    where: { id: session.user.coachId ?? "" },
    select: { plan_actual: true },
  })

  if (!coachActual) return NextResponse.json({ error: "NO_ENCONTRADO" }, { status: 404 })
  if (coachActual.plan_actual !== "inicial") {
    return NextResponse.json({ error: "FEATURE_NOT_AVAILABLE", mensaje: "El perfil público es exclusivo del Plan Inicial" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "DATOS_INVALIDOS", detalles: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { slug, telefono, especialidades_tags, ...coachData } = parsed.data

  // Validar slug si viene
  if (slug !== undefined) {
    const v = validarSlug(slug)
    if (!v.valido) return NextResponse.json({ error: "SLUG_INVALIDO", mensaje: v.error }, { status: 400 })

    // Verificar unicidad
    const existe = await prisma.coach.findFirst({
      where: { slug, NOT: { id: session.user.coachId ?? "" } },
      select: { id: true },
    })
    if (existe) return NextResponse.json({ error: "SLUG_OCUPADO", mensaje: "Esta URL ya está en uso" }, { status: 409 })
  }

  // Validar especialidades
  if (especialidades_tags) {
    const invalidas = especialidades_tags.filter((e) => !ESPECIALIDADES_VALIDAS.includes(e))
    if (invalidas.length > 0) {
      return NextResponse.json({ error: "ESPECIALIDAD_INVALIDA" }, { status: 400 })
    }
  }

  await prisma.coach.update({
    where: { id: session.user.coachId ?? "" },
    data: {
      ...coachData,
      ...(slug !== undefined ? { slug } : {}),
      ...(especialidades_tags !== undefined ? { especialidades_tags } : {}),
    },
  })

  if (telefono !== undefined) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { telefono },
    })
  }

  return NextResponse.json({ ok: true })
}
