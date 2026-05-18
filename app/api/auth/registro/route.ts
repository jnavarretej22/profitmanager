import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { enviarEmail } from "@/lib/email"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"

const registroSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  apellido: z.string().min(2, "El apellido debe tener al menos 2 caracteres").max(100),
  email: z.string().email("Email inválido").toLowerCase(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  pais: z.string().length(2, "Selecciona un país").optional(),
  zona_horaria: z.string().optional(),
  terminos: z.literal(true, { error: "Debes aceptar los términos" }),
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  const rl = checkRateLimit(`registro:${ip}`, RATE_LIMITS.registro)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMIT", mensaje: "Demasiados intentos. Espera unos minutos." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
    )
  }
  try {
    const body = await req.json()
    const parsed = registroSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "DATOS_INVALIDOS", detalles: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { nombre, apellido, email, password, pais, zona_horaria } = parsed.data

    // Verificar si el email ya existe
    const existe = await prisma.user.findUnique({ where: { email } })
    if (existe) {
      return NextResponse.json(
        { error: "EMAIL_DUPLICADO", message: "Este email ya está registrado" },
        { status: 409 }
      )
    }

    const password_hash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
        role: "coach",
        nombre,
        apellido,
        pais: pais ?? "EC",
        zona_horaria: zona_horaria ?? "America/Guayaquil",
        activo: true,
        email_verificado: false,
        coach: {
          create: {
            plan_actual: "gratis",
            estado_plan: "activo",
          },
        },
      },
      include: { coach: true },
    })

    // Notificación de bienvenida
    await prisma.notificacion.create({
      data: {
        user_id: user.id,
        tipo: "bienvenida",
        titulo: "¡Bienvenido a ProFit Manager!",
        mensaje: `Hola ${nombre}, tu cuenta está lista. Empieza registrando a tu primer alumno.`,
        link: "/coach/alumnos",
      },
    })

    // Email de bienvenida al coach (no bloquea la respuesta)
    enviarEmail(email, {
      tipo: "bienvenida-coach",
      data: { nombre, email },
    }).catch(console.error)

    return NextResponse.json({ ok: true, userId: user.id }, { status: 201 })
  } catch (e) {
    console.error("[/api/auth/registro]", e)
    return NextResponse.json({ error: "ERROR_INTERNO" }, { status: 500 })
  }
}
