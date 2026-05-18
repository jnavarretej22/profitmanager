import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { validarSlug } from "@/lib/slug"

// GET /api/coach/slug-disponible?slug=jorge-sanchez
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "coach") {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const slug = req.nextUrl.searchParams.get("slug")?.toLowerCase().trim() ?? ""

  const validacion = validarSlug(slug)
  if (!validacion.valido) {
    return NextResponse.json({ disponible: false, error: validacion.error })
  }

  // Verificar que no lo use otro coach (distinto al actual)
  const existe = await prisma.coach.findFirst({
    where: {
      slug,
      NOT: { id: session.user.coachId ?? "" },
    },
    select: { id: true },
  })

  return NextResponse.json({ disponible: !existe })
}
