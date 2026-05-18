import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { crearOAuthClient, cifrarToken } from "@/lib/google-calendar"

// GET /api/google/callback — callback de OAuth2 de Google
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "coach" || !session.user.coachId) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  // Verificar plan antes de guardar el token
  const coach = await prisma.coach.findUnique({
    where: { id: session.user.coachId },
    select: { plan_actual: true },
  })
  if (!coach || coach.plan_actual !== "inicial") {
    return NextResponse.redirect(new URL("/coach/perfil?google=error", req.nextUrl))
  }

  const code = req.nextUrl.searchParams.get("code")
  const error = req.nextUrl.searchParams.get("error")

  if (error || !code) {
    return NextResponse.redirect(new URL("/coach/perfil?google=error", req.nextUrl))
  }

  try {
    const oAuth2Client = crearOAuthClient()
    const { tokens } = await oAuth2Client.getToken(code)
    const tokenCifrado = await cifrarToken(tokens)

    await prisma.coach.update({
      where: { id: session.user.coachId },
      data: { google_calendar_token: tokenCifrado },
    })

    return NextResponse.redirect(new URL("/coach/perfil?google=ok", req.nextUrl))
  } catch (err) {
    console.error("Error en callback de Google:", err)
    return NextResponse.redirect(new URL("/coach/perfil?google=error", req.nextUrl))
  }
}
