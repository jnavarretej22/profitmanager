import { prisma } from "@/lib/db"

const SISTEMA_EMAIL = "system@profitmanager.app"

// Devuelve (creándolo si no existe) el coach reservado al que se asocian
// los templates del sistema (rutinas y planes alimenticios con
// es_template_sistema = true). El user asociado está inactivo para que nadie
// pueda autenticarse con esta cuenta.
export async function obtenerCoachSistemaId(): Promise<string> {
  // Camino rápido: si ya existe, no necesitamos transacción.
  const existente = await prisma.coach.findFirst({
    where:  { user: { email: SISTEMA_EMAIL } },
    select: { id: true },
  })
  if (existente) return existente.id

  // Camino lento (primera vez): upsert sobre los unique constraints (email, user_id)
  // hace la creación idempotente — si dos requests llegan concurrentes,
  // ambos terminan con el mismo coach en lugar de fallar con unique violation.
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where:  { email: SISTEMA_EMAIL },
      update: {},
      create: {
        email:            SISTEMA_EMAIL,
        password_hash:    null,
        role:             "coach",
        nombre:           "Sistema",
        apellido:         "ProFit",
        activo:           false,
        email_verificado: true,
      },
      select: { id: true },
    })
    const coach = await tx.coach.upsert({
      where:  { user_id: user.id },
      update: {},
      create: {
        user_id:     user.id,
        plan_actual: "inicial",
        estado_plan: "activo",
      },
      select: { id: true },
    })
    return coach.id
  })
}
