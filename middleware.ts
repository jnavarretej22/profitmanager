export const runtime = "nodejs"

import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"

// APIs donde el alumno SÍ puede escribir
const ALUMNO_API_MUTACION_PERMITIDA = [
  "/api/alumno/perfil",
  "/api/alumno/cambiar-password",
  "/api/notificaciones",  // marcar como leídas
]

// Rutas de API que no requieren sesión (tienen su propia autenticación)
const API_SIN_SESION = [
  "/api/cron/",         // protegidas por CRON_SECRET
  "/api/auth/",         // gestionadas por NextAuth
  "/api/public/",       // datos públicos (perfiles de coaches)
]

// Prefijos de segmentos que son rutas de la app (no slugs de coaches)
const SEGMENTOS_APP = [
  "login", "registro", "admin", "coach", "alumno", "api",
  "terminos", "privacidad", "recuperar-contrasena", "nueva-contrasena",
  "auth", "notificaciones", "_next", "static", "favicon.ico",
]

export async function middleware(req: NextRequest) {
  const session = await auth()
  const pathname = req.nextUrl.pathname
  const method   = req.method

  // Rutas públicas de UI
  const rutasPublicasUI = [
    "/",
    "/login",
    "/registro",
    "/recuperar-contrasena",
    "/nueva-contrasena",
    "/auth/redirect",
    "/terminos",
    "/privacidad",
  ]

  const esRutaPublicaUI  = rutasPublicasUI.some((r) => pathname === r || pathname.startsWith(r + "/"))
  const esApiSinSesion   = API_SIN_SESION.some((p) => pathname.startsWith(p))
  const esAsset          = pathname.startsWith("/_next") || pathname.startsWith("/favicon")

  // Slug de perfil público: segmento raíz de primer nivel, sin extensión de archivo, que no sea ruta de la app
  const partes         = pathname.split("/")
  const primerSegmento = partes[1] ?? ""
  const tieneExtension = primerSegmento.includes(".")
  const esSlugCoach    = primerSegmento.length > 0
    && !SEGMENTOS_APP.includes(primerSegmento)
    && partes.length === 2
    && !tieneExtension

  // Rate limiting en rutas de autenticación sensibles
  if (pathname === "/api/auth/callback/credentials" || pathname === "/api/auth/signin") {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
    const rl = checkRateLimit(`login:${ip}`, RATE_LIMITS.login)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "RATE_LIMIT", mensaje: "Demasiados intentos de inicio de sesión. Espera 15 minutos." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
      )
    }
  }

  // Pasar sin verificar sesión: assets, UI pública, APIs con auth propia, slugs de coaches
  if (esAsset || esRutaPublicaUI || esApiSinSesion || esSlugCoach) return NextResponse.next()

  // Sin sesión → login (solo para rutas que requieren autenticación)
  if (!session) {
    // APIs REST sin sesión → JSON 401, no redirect
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "NO_AUTORIZADO", mensaje: "Debes iniciar sesión" },
        { status: 401 }
      )
    }
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  const rol = session.user?.role
  const esRutaCoach  = pathname.startsWith("/coach")
  const esRutaAlumno = pathname.startsWith("/alumno")
  const esRutaAdmin  = pathname.startsWith("/admin")

  // Rol incorrecto → raíz
  if (esRutaCoach  && rol !== "coach")  return NextResponse.redirect(new URL("/", req.nextUrl))
  if (esRutaAlumno && rol !== "alumno") return NextResponse.redirect(new URL("/", req.nextUrl))
  if (esRutaAdmin  && rol !== "admin")  return NextResponse.redirect(new URL("/", req.nextUrl))

  // Bloqueo de mutaciones para alumnos — regla crítica de negocio
  const esMutacion = ["POST","PUT","PATCH","DELETE"].includes(method)
  const esApiGenerica = pathname.startsWith("/api/") && !pathname.startsWith("/api/auth")
  const permitidaParaAlumno = ALUMNO_API_MUTACION_PERMITIDA.some((p) => pathname.startsWith(p))

  if (rol === "alumno" && esMutacion && esApiGenerica && !permitidaParaAlumno) {
    return NextResponse.json(
      { error: "SOLO_LECTURA_ALUMNO", mensaje: "Los alumnos no pueden modificar datos" },
      { status: 403 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
