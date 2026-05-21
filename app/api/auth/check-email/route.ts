import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET /api/auth/check-email?email=xxx
// Indica al form de login si la cuenta:
//   - no existe → no permitir login
//   - existe y NO tiene password_hash → primera vez, debe crear contraseña
//   - existe y tiene password_hash → flujo normal
// Nota: este endpoint expone si un email existe en el sistema (enumeración).
// Es aceptable en MVP porque el universo de emails de alumnos es cerrado
// (los crea el coach manualmente). Si se vuelve público, agregar rate limit.
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim() ?? ""

  if (!email || !email.includes("@") || email.length > 255) {
    return NextResponse.json({ existe: false, requiereSetup: false })
  }

  const user = await prisma.user.findUnique({
    where:  { email },
    select: { password_hash: true, activo: true, deleted_at: true, role: true },
  })

  if (!user || !user.activo || user.deleted_at !== null) {
    return NextResponse.json({ existe: false, requiereSetup: false })
  }

  return NextResponse.json({
    existe:        true,
    requiereSetup: user.password_hash === null,
    role:          user.role,
  })
}
