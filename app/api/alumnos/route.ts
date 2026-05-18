import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { getCoachAutenticado, requireModoActivo, requireLimiteAlumnos, errorResponse } from "@/lib/plan-guard"
import { enviarEmail } from "@/lib/email"
import type { Role, Genero, Objetivo } from "@prisma/client"

const crearAlumnoSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(100),
  apellido: z.string().min(2, "Mínimo 2 caracteres").max(100),
  email: z.string().email("Email inválido").toLowerCase(),
  telefono: z.string().optional(),
  identificacion: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  genero: z.enum(["M", "F", "otro"]).optional(),
  altura_cm: z.number().int().positive().optional(),
  peso_inicial_kg: z.number().positive().optional(),
  objetivo: z.enum(["hipertrofia", "perdida_grasa", "fuerza", "resistencia", "general"]).optional(),
  fecha_inicio: z.string().optional(),
  notas_medicas: z.string().optional(),
})

// GET /api/alumnos — listar alumnos del coach
export async function GET(req: NextRequest) {
  const { coach, error } = await getCoachAutenticado()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const busqueda = searchParams.get("q") ?? ""
  const objetivo = searchParams.get("objetivo")
  const estado = searchParams.get("estado") // "activo" | "archivado" | undefined

  const alumnos = await prisma.alumno.findMany({
    where: {
      coach_id: coach!.id,
      deleted_at: null,
      ...(estado === "activo" ? { activo: true } : estado === "archivado" ? { activo: false } : {}),
      ...(objetivo ? { objetivo: objetivo as never } : {}),
      ...(busqueda
        ? {
            OR: [
              { user: { nombre: { contains: busqueda, mode: "insensitive" } } },
              { user: { apellido: { contains: busqueda, mode: "insensitive" } } },
              { user: { email: { contains: busqueda, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { nombre: true, apellido: true, email: true, telefono: true } },
      mediciones: { orderBy: { fecha: "desc" }, take: 1, select: { peso_kg: true, fecha: true } },
    },
    orderBy: { created_at: "desc" },
  })

  return NextResponse.json({ alumnos })
}

// POST /api/alumnos — crear alumno
export async function POST(req: NextRequest) {
  const { coach, error } = await getCoachAutenticado()
  if (error) return error

  const modoError = requireModoActivo(coach!)
  if (modoError) return modoError

  const limiteError = await requireLimiteAlumnos(coach!.id, coach!.plan_actual)
  if (limiteError) return limiteError

  const body = await req.json()
  const parsed = crearAlumnoSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse("DATOS_INVALIDOS", "Datos inválidos", 400)
  }

  const {
    nombre, apellido, email, telefono, identificacion,
    fecha_nacimiento, genero, altura_cm, peso_inicial_kg,
    objetivo, fecha_inicio, notas_medicas,
  } = parsed.data

  // Verificar email único
  const emailExiste = await prisma.user.findUnique({ where: { email } })
  if (emailExiste) {
    return NextResponse.json({ error: "EMAIL_DUPLICADO", mensaje: "Este email ya está registrado" }, { status: 409 })
  }

  // Crear usuario con contraseña temporal
  const tempPassword = Math.random().toString(36).slice(2, 10)
  const password_hash = await bcrypt.hash(tempPassword, 12)

  // Crear usuario primero y luego el alumno (evita conflicto de tipos Prisma unchecked)
  const nuevoUser = await prisma.user.create({
    data: {
      email,
      password_hash,
      role: "alumno" as Role,
      nombre,
      apellido,
      telefono,
      activo: true,
      email_verificado: false,
    },
  })

  const alumno = await prisma.alumno.create({
    data: {
      user_id: nuevoUser.id,
      coach_id: coach!.id,
      identificacion,
      fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : undefined,
      genero: genero as Genero,
      altura_cm,
      peso_inicial_kg,
      objetivo: objetivo as Objetivo,
      fecha_inicio: fecha_inicio ? new Date(fecha_inicio) : new Date(),
      notas_medicas,
      activo: true,
    },
    include: {
      user: { select: { id: true, nombre: true, apellido: true, email: true } },
    },
  })

  // Notificación al coach
  const coachUser = await prisma.coach.findUnique({ where: { id: coach!.id }, select: { user_id: true, user: { select: { nombre: true, apellido: true } } } })
  if (coachUser) {
    await prisma.notificacion.create({
      data: {
        user_id: coachUser.user_id,
        tipo: "bienvenida",
        titulo: "Nuevo alumno registrado",
        mensaje: `${nombre} ${apellido} fue agregado a tu lista de alumnos.`,
        link: `/coach/alumnos/${alumno.id}`,
      },
    })
  }

  // Email de bienvenida al alumno (no bloquea la respuesta)
  const nombreCoach = coachUser?.user
    ? `${coachUser.user.nombre} ${coachUser.user.apellido}`
    : "tu entrenador"
  enviarEmail(email, {
    tipo: "bienvenida-alumno",
    data: {
      nombreAlumno:     nombre,
      nombreCoach,
      email:            body.email ?? "",
      passwordTemporal: "(ver email de acceso)",
      linkDashboard:    `${process.env.NEXTAUTH_URL ?? ""}/alumno`,
    },
  }).catch(console.error)

  return NextResponse.json({ ok: true, alumno }, { status: 201 })
}
