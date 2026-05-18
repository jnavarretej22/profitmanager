import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET /api/public/coach/[slug] — datos públicos del coach, sin sesión requerida
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const coach = await prisma.coach.findUnique({
    where: { slug },
    select: {
      id:                    true,
      perfil_publico_activo: true,
      plan_actual:           true,
      foto_publica_url:      true,
      titulo_profesional:    true,
      bio:                   true,
      especialidades_tags:   true,
      anios_experiencia:     true,
      ciudad:                true,
      instagram_url:         true,
      cta_whatsapp_texto:    true,
      slug:                  true,
      user: {
        select: {
          nombre:   true,
          apellido: true,
          telefono: true,
          pais:     true,
        },
      },
      // Número de alumnos activos (dato público seguro)
      _count: {
        select: { alumnos: { where: { activo: true, deleted_at: null } } },
      },
    },
  })

  if (!coach || !coach.perfil_publico_activo || coach.plan_actual !== "inicial") {
    return NextResponse.json({ error: "NO_ENCONTRADO" }, { status: 404 })
  }

  return NextResponse.json({
    coach: {
      nombre:              coach.user.nombre,
      apellido:            coach.user.apellido,
      telefono:            coach.user.telefono,
      pais:                coach.user.pais,
      foto_publica_url:    coach.foto_publica_url,
      titulo_profesional:  coach.titulo_profesional,
      bio:                 coach.bio,
      especialidades_tags: coach.especialidades_tags,
      anios_experiencia:   coach.anios_experiencia,
      ciudad:              coach.ciudad,
      instagram_url:       coach.instagram_url,
      cta_whatsapp_texto:  coach.cta_whatsapp_texto,
      slug:                coach.slug,
      total_alumnos:       coach._count.alumnos,
    },
  })
}
