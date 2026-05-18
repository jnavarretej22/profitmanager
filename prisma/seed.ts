import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Iniciando seed de ProFit Manager...")

  // ─── Admin ───────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("admin123", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@profitmanager.app" },
    update: {},
    create: {
      email: "admin@profitmanager.app",
      password_hash: adminHash,
      role: "admin",
      nombre: "Admin",
      apellido: "ProFit",
      pais: "EC",
      zona_horaria: "America/Guayaquil",
      activo: true,
      email_verificado: true,
    },
  })
  console.log("✅ Admin creado:", admin.email)

  // ─── Coach 1 — Plan Gratis ────────────────────────────────────────────────────
  const coachHash = await bcrypt.hash("coach123", 12)
  const coachUser1 = await prisma.user.upsert({
    where: { email: "coach.gratis@profitmanager.app" },
    update: {},
    create: {
      email: "coach.gratis@profitmanager.app",
      password_hash: coachHash,
      role: "coach",
      nombre: "Andrea",
      apellido: "Vélez",
      telefono: "+593987654321",
      pais: "EC",
      zona_horaria: "America/Guayaquil",
      activo: true,
      email_verificado: true,
    },
  })

  const coach1 = await prisma.coach.upsert({
    where: { user_id: coachUser1.id },
    update: {},
    create: {
      user_id: coachUser1.id,
      plan_actual: "gratis",
      estado_plan: "activo",
      especialidad: "Pérdida de grasa",
      bio: "Coach certificada con 5 años de experiencia en nutrición y entrenamiento funcional.",
    },
  })
  console.log("✅ Coach Gratis creado:", coachUser1.email)

  // ─── Coach 2 — Plan Inicial ────────────────────────────────────────────────────
  const coachUser2 = await prisma.user.upsert({
    where: { email: "coach.inicial@profitmanager.app" },
    update: {},
    create: {
      email: "coach.inicial@profitmanager.app",
      password_hash: coachHash,
      role: "coach",
      nombre: "José Luis",
      apellido: "Bedón",
      telefono: "+593991234567",
      pais: "EC",
      zona_horaria: "America/Guayaquil",
      activo: true,
      email_verificado: true,
    },
  })

  const vencimiento = new Date()
  vencimiento.setMonth(vencimiento.getMonth() + 1)

  const coach2 = await prisma.coach.upsert({
    where: { user_id: coachUser2.id },
    update: {},
    create: {
      user_id: coachUser2.id,
      plan_actual: "inicial",
      periodicidad: "mensual",
      fecha_inicio_plan: new Date(),
      fecha_vencimiento: vencimiento,
      estado_plan: "activo",
      especialidad: "Hipertrofia y fuerza",
      bio: "Entrenador personal certificado NSCA. Especialista en fuerza y acondicionamiento.",
    },
  })
  console.log("✅ Coach Inicial creado:", coachUser2.email)

  // ─── Alumnos del Coach 1 (Gratis — máx 3) ────────────────────────────────────
  const alumnoHash = await bcrypt.hash("alumno123", 12)

  const alumnoData1 = [
    { nombre: "Carla",    apellido: "Pérez",   email: "carla@test.com",   objetivo: "perdida_grasa" as const },
    { nombre: "Luis",     apellido: "Torres",  email: "luis@test.com",    objetivo: "general" as const },
    { nombre: "María",    apellido: "Salazar", email: "maria@test.com",   objetivo: "resistencia" as const },
  ]

  for (const a of alumnoData1) {
    const userAlumno = await prisma.user.upsert({
      where: { email: a.email },
      update: {},
      create: {
        email: a.email,
        password_hash: alumnoHash,
        role: "alumno",
        nombre: a.nombre,
        apellido: a.apellido,
        pais: "EC",
        zona_horaria: "America/Guayaquil",
        activo: true,
        email_verificado: true,
      },
    })

    await prisma.alumno.upsert({
      where: { user_id: userAlumno.id },
      update: {},
      create: {
        user_id: userAlumno.id,
        coach_id: coach1.id,
        genero: "F",
        altura_cm: 165,
        peso_inicial_kg: 70,
        objetivo: a.objetivo,
        fecha_inicio: new Date(),
        activo: true,
      },
    })
  }
  console.log("✅ 3 alumnos del Coach Gratis creados")

  // ─── Alumnos del Coach 2 (Inicial) ────────────────────────────────────────────
  const alumnoData2 = [
    { nombre: "Andrés",    apellido: "Gómez",    email: "andres@test.com",    objetivo: "hipertrofia" as const,   genero: "M" as const, peso: 75 },
    { nombre: "Diana",     apellido: "Salazar",  email: "diana@test.com",     objetivo: "perdida_grasa" as const, genero: "F" as const, peso: 68 },
    { nombre: "Ricardo",   apellido: "Mora",     email: "ricardo@test.com",   objetivo: "fuerza" as const,        genero: "M" as const, peso: 85 },
    { nombre: "Valentina", apellido: "Cordero",  email: "valentina@test.com", objetivo: "resistencia" as const,   genero: "F" as const, peso: 60 },
    { nombre: "Esteban",   apellido: "León",     email: "esteban@test.com",   objetivo: "hipertrofia" as const,   genero: "M" as const, peso: 78 },
  ]

  const alumnosCoach2 = []
  for (const a of alumnoData2) {
    const userAlumno = await prisma.user.upsert({
      where: { email: a.email },
      update: {},
      create: {
        email: a.email,
        password_hash: alumnoHash,
        role: "alumno",
        nombre: a.nombre,
        apellido: a.apellido,
        pais: "EC",
        zona_horaria: "America/Guayaquil",
        activo: true,
        email_verificado: true,
      },
    })

    const alumno = await prisma.alumno.upsert({
      where: { user_id: userAlumno.id },
      update: {},
      create: {
        user_id: userAlumno.id,
        coach_id: coach2.id,
        genero: a.genero,
        altura_cm: 170,
        peso_inicial_kg: a.peso,
        objetivo: a.objetivo,
        fecha_inicio: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000), // 6 semanas atrás
        activo: true,
      },
    })
    alumnosCoach2.push(alumno)
  }
  console.log("✅ 5 alumnos del Coach Inicial creados")

  // ─── Mediciones de ejemplo (primer alumno del Coach 2) ────────────────────────
  const alumnoMedicion = alumnosCoach2[0]
  const semanas = 6
  for (let i = semanas; i >= 0; i--) {
    const fecha = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000)
    await prisma.medicion.create({
      data: {
        alumno_id: alumnoMedicion.id,
        registrado_por: coachUser2.id,
        fecha,
        peso_kg: 75 - (semanas - i) * 0.4,
        cintura_cm: 85 - (semanas - i) * 0.5,
        porcentaje_grasa: 18 - (semanas - i) * 0.3,
      },
    })
  }
  console.log("✅ Mediciones de ejemplo creadas")

  // ─── Templates de rutinas del sistema (creados por admin) ────────────────────
  const templateRutinas = [
    {
      nombre: "Full Body Hipertrofia — Principiantes",
      objetivo: "hipertrofia" as const,
      descripcion: "Rutina de cuerpo completo 3 días a la semana. Ideal para comenzar con hipertrofia.",
      duracion_minutos: 60,
      dias_semana: ["lunes", "miercoles", "viernes"],
      plan_requerido: "inicial" as const,
      ejercicios: [
        { orden: 1, nombre: "Sentadilla con barra", series: 4, repeticiones: "8-10", descanso_segundos: 90, rpe: "7-8" },
        { orden: 2, nombre: "Press de banca", series: 4, repeticiones: "8-10", descanso_segundos: 90, rpe: "7-8" },
        { orden: 3, nombre: "Remo con barra", series: 3, repeticiones: "10-12", descanso_segundos: 60 },
        { orden: 4, nombre: "Press militar", series: 3, repeticiones: "10-12", descanso_segundos: 60 },
        { orden: 5, nombre: "Curl de bíceps", series: 3, repeticiones: "12-15", descanso_segundos: 45 },
        { orden: 6, nombre: "Extensión de tríceps en polea", series: 3, repeticiones: "12-15", descanso_segundos: 45 },
      ],
    },
    {
      nombre: "Cardio HIIT — Pérdida de grasa",
      objetivo: "perdida_grasa" as const,
      descripcion: "Entrenamiento intervalado de alta intensidad. 4 días a la semana.",
      duracion_minutos: 45,
      dias_semana: ["lunes", "martes", "jueves", "viernes"],
      plan_requerido: "inicial" as const,
      ejercicios: [
        { orden: 1, nombre: "Calentamiento trote suave", series: 1, repeticiones: "10 min", descanso_segundos: 0 },
        { orden: 2, nombre: "Sprint 30 seg / Caminata 60 seg", series: 8, repeticiones: "1 ciclo", descanso_segundos: 0 },
        { orden: 3, nombre: "Burpees", series: 3, repeticiones: "15", descanso_segundos: 30 },
        { orden: 4, nombre: "Sentadillas con salto", series: 3, repeticiones: "20", descanso_segundos: 30 },
        { orden: 5, nombre: "Vuelta a la calma", series: 1, repeticiones: "5 min", descanso_segundos: 0 },
      ],
    },
    {
      nombre: "Rutina de Fuerza — 5x5",
      objetivo: "fuerza" as const,
      descripcion: "Protocolo clásico de fuerza 5x5. Tres días por semana.",
      duracion_minutos: 75,
      dias_semana: ["lunes", "miercoles", "viernes"],
      plan_requerido: "inicial" as const,
      ejercicios: [
        { orden: 1, nombre: "Sentadilla", series: 5, repeticiones: "5", descanso_segundos: 180, rpe: "8-9" },
        { orden: 2, nombre: "Press de banca", series: 5, repeticiones: "5", descanso_segundos: 180, rpe: "8-9" },
        { orden: 3, nombre: "Peso muerto", series: 1, repeticiones: "5", descanso_segundos: 300, rpe: "9" },
      ],
    },
    {
      nombre: "Rutina General — Sin equipo",
      objetivo: "general" as const,
      descripcion: "Rutina básica sin equipamiento para comenzar a moverse. Disponible en plan Gratis.",
      duracion_minutos: 40,
      dias_semana: ["lunes", "miercoles", "viernes"],
      plan_requerido: "gratis" as const,
      ejercicios: [
        { orden: 1, nombre: "Sentadillas", series: 3, repeticiones: "15", descanso_segundos: 45 },
        { orden: 2, nombre: "Flexiones de brazos", series: 3, repeticiones: "10", descanso_segundos: 45 },
        { orden: 3, nombre: "Zancadas", series: 3, repeticiones: "12 c/pierna", descanso_segundos: 45 },
        { orden: 4, nombre: "Plancha", series: 3, repeticiones: "30 seg", descanso_segundos: 30 },
        { orden: 5, nombre: "Mountain climbers", series: 3, repeticiones: "20", descanso_segundos: 30 },
      ],
    },
  ]

  for (const t of templateRutinas) {
    const rutina = await prisma.rutina.create({
      data: {
        coach_id: coach2.id, // el admin usa coach2 como propietario temporal en el seed
        es_template: true,
        es_template_sistema: true,
        plan_requerido: t.plan_requerido,
        objetivo: t.objetivo,
        nombre: t.nombre,
        descripcion: t.descripcion,
        duracion_minutos: t.duracion_minutos,
        dias_semana: t.dias_semana,
      },
    })

    for (const e of t.ejercicios) {
      await prisma.ejercicioRutina.create({
        data: {
          rutina_id: rutina.id,
          orden: e.orden,
          nombre: e.nombre,
          series: e.series,
          repeticiones: e.repeticiones,
          descanso_segundos: e.descanso_segundos,
          rpe: (e as { rpe?: string }).rpe ?? null,
        },
      })
    }
  }
  console.log("✅ Templates de rutinas del sistema creados")

  console.log("\n🎉 Seed completado exitosamente.")
  console.log("\nCredenciales de acceso:")
  console.log("  Admin:        admin@profitmanager.app / admin123")
  console.log("  Coach Gratis: coach.gratis@profitmanager.app / coach123")
  console.log("  Coach Inicial: coach.inicial@profitmanager.app / coach123")
  console.log("  Alumnos:      [email anterior] / alumno123")
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
