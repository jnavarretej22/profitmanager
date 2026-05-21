// Seed ejecutable con Node.js nativo (ESM)
import { createRequire } from "module"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import { readFileSync } from "fs"

const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))

// Cargar .env
const envPath = join(__dirname, "../.env")
try {
  const envContent = readFileSync(envPath, "utf-8")
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIdx = trimmed.indexOf("=")
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let value = trimmed.slice(eqIdx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
} catch {
  // .env no encontrado
}

const { PrismaClient } = require("@prisma/client")
const { PrismaNeon } = require("@prisma/adapter-neon")
const bcrypt = require("bcryptjs")

async function main() {
  // Pool dentro de main() para garantizar que .env ya está cargado
  // Para seeds usamos la URL directa (sin pooler) para evitar limitaciones de PgBouncer
  const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL
  if (!dbUrl) throw new Error("DIRECT_URL o DATABASE_URL no están definidas")

  const adapter = new PrismaNeon({ connectionString: dbUrl })
  const prisma = new PrismaClient({ adapter })

  console.log("🌱 Iniciando seed de ProFit Manager...")

  // ─── Admin ──────────────────────────────────────────────────────────────────
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

  // ─── Coach 1 — Plan Gratis ──────────────────────────────────────────────────
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

  // ─── Coach 2 — Plan Inicial ─────────────────────────────────────────────────
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

  // ─── Alumnos del Coach 1 (Gratis — máx 3) ──────────────────────────────────
  const alumnoHash = await bcrypt.hash("alumno123", 12)

  const alumnoData1 = [
    { nombre: "Carla",  apellido: "Pérez",   email: "carla@test.com",  objetivo: "perdida_grasa" },
    { nombre: "Luis",   apellido: "Torres",  email: "luis@test.com",   objetivo: "general" },
    { nombre: "María",  apellido: "Salazar", email: "maria@test.com",  objetivo: "resistencia" },
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

  // ─── Alumnos del Coach 2 (Inicial) ─────────────────────────────────────────
  const alumnoData2 = [
    { nombre: "Andrés",    apellido: "Gómez",   email: "andres@test.com",    objetivo: "hipertrofia",   genero: "M", peso: 75 },
    { nombre: "Diana",     apellido: "Salazar", email: "diana@test.com",     objetivo: "perdida_grasa", genero: "F", peso: 68 },
    { nombre: "Ricardo",   apellido: "Mora",    email: "ricardo@test.com",   objetivo: "fuerza",        genero: "M", peso: 85 },
    { nombre: "Valentina", apellido: "Cordero", email: "valentina@test.com", objetivo: "resistencia",   genero: "F", peso: 60 },
    { nombre: "Esteban",   apellido: "León",    email: "esteban@test.com",   objetivo: "hipertrofia",   genero: "M", peso: 78 },
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
        fecha_inicio: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000),
        activo: true,
      },
    })
    alumnosCoach2.push(alumno)
  }
  console.log("✅ 5 alumnos del Coach Inicial creados")

  // ─── Mediciones de ejemplo ──────────────────────────────────────────────────
  const alumnoMedicion = alumnosCoach2[0]
  const semanas = 6
  for (let i = semanas; i >= 0; i--) {
    const fecha = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000)
    await prisma.medicion.create({
      data: {
        alumno_id: alumnoMedicion.id,
        registrado_por: coachUser2.id,
        fecha,
        peso_kg: parseFloat((75 - (semanas - i) * 0.4).toFixed(2)),
        cintura_cm: parseFloat((85 - (semanas - i) * 0.5).toFixed(2)),
        porcentaje_grasa: parseFloat((18 - (semanas - i) * 0.3).toFixed(2)),
      },
    })
  }
  console.log("✅ Mediciones de ejemplo creadas")

  // ─── Templates de rutinas del sistema ──────────────────────────────────────
  const templateRutinas = [
    {
      nombre: "Full Body Hipertrofia — Principiantes",
      objetivo: "hipertrofia",
      descripcion: "Rutina de cuerpo completo 3 días a la semana. Ideal para comenzar con hipertrofia.",
      duracion_minutos: 60,
      dias_semana: ["lunes", "miercoles", "viernes"],
      plan_requerido: "inicial",
      ejercicios: [
        { orden: 1, nombre: "Sentadilla con barra", series: 4, repeticiones: "8-10", descanso_segundos: 90, rpe: "7-8" },
        { orden: 2, nombre: "Press de banca",       series: 4, repeticiones: "8-10", descanso_segundos: 90, rpe: "7-8" },
        { orden: 3, nombre: "Remo con barra",        series: 3, repeticiones: "10-12", descanso_segundos: 60 },
        { orden: 4, nombre: "Press militar",         series: 3, repeticiones: "10-12", descanso_segundos: 60 },
        { orden: 5, nombre: "Curl de bíceps",        series: 3, repeticiones: "12-15", descanso_segundos: 45 },
        { orden: 6, nombre: "Extensión tríceps polea", series: 3, repeticiones: "12-15", descanso_segundos: 45 },
      ],
    },
    {
      nombre: "Cardio HIIT — Pérdida de grasa",
      objetivo: "perdida_grasa",
      descripcion: "Entrenamiento intervalado de alta intensidad. 4 días a la semana.",
      duracion_minutos: 45,
      dias_semana: ["lunes", "martes", "jueves", "viernes"],
      plan_requerido: "inicial",
      ejercicios: [
        { orden: 1, nombre: "Calentamiento trote suave", series: 1, repeticiones: "10 min", descanso_segundos: 0 },
        { orden: 2, nombre: "Sprint 30s / Caminata 60s", series: 8, repeticiones: "1 ciclo", descanso_segundos: 0 },
        { orden: 3, nombre: "Burpees", series: 3, repeticiones: "15", descanso_segundos: 30 },
        { orden: 4, nombre: "Sentadillas con salto", series: 3, repeticiones: "20", descanso_segundos: 30 },
        { orden: 5, nombre: "Vuelta a la calma", series: 1, repeticiones: "5 min", descanso_segundos: 0 },
      ],
    },
    {
      nombre: "Rutina de Fuerza — 5x5",
      objetivo: "fuerza",
      descripcion: "Protocolo clásico de fuerza 5x5. Tres días por semana.",
      duracion_minutos: 75,
      dias_semana: ["lunes", "miercoles", "viernes"],
      plan_requerido: "inicial",
      ejercicios: [
        { orden: 1, nombre: "Sentadilla",   series: 5, repeticiones: "5", descanso_segundos: 180, rpe: "8-9" },
        { orden: 2, nombre: "Press banca",  series: 5, repeticiones: "5", descanso_segundos: 180, rpe: "8-9" },
        { orden: 3, nombre: "Peso muerto",  series: 1, repeticiones: "5", descanso_segundos: 300, rpe: "9" },
      ],
    },
    {
      nombre: "Rutina General — Sin equipo",
      objetivo: "general",
      descripcion: "Rutina básica sin equipamiento. Disponible en plan Gratis.",
      duracion_minutos: 40,
      dias_semana: ["lunes", "miercoles", "viernes"],
      plan_requerido: "gratis",
      ejercicios: [
        { orden: 1, nombre: "Sentadillas",        series: 3, repeticiones: "15",        descanso_segundos: 45 },
        { orden: 2, nombre: "Flexiones de brazos",series: 3, repeticiones: "10",        descanso_segundos: 45 },
        { orden: 3, nombre: "Zancadas",           series: 3, repeticiones: "12 c/pierna", descanso_segundos: 45 },
        { orden: 4, nombre: "Plancha",            series: 3, repeticiones: "30 seg",    descanso_segundos: 30 },
        { orden: 5, nombre: "Mountain climbers",  series: 3, repeticiones: "20",        descanso_segundos: 30 },
      ],
    },
  ]

  const ORDEN_DIAS = ["lunes","martes","miercoles","jueves","viernes","sabado","domingo"]

  for (const t of templateRutinas) {
    await prisma.rutina.create({
      data: {
        coach_id: coach2.id,
        es_template: true,
        es_template_sistema: true,
        plan_requerido: t.plan_requerido,
        objetivo: t.objetivo,
        nombre: t.nombre,
        descripcion: t.descripcion,
        duracion_minutos: t.duracion_minutos,
        dias: {
          create: ORDEN_DIAS.map((dia, idx) => {
            const esDiaActivo = t.dias_semana.includes(dia)
            return {
              dia_semana: dia,
              orden: idx + 1,
              es_descanso: !esDiaActivo,
              ejercicios: esDiaActivo
                ? {
                    create: t.ejercicios.map((e) => ({
                      orden:             e.orden,
                      nombre:            e.nombre,
                      series:            e.series,
                      repeticiones:      e.repeticiones,
                      descanso_segundos: e.descanso_segundos,
                      rpe:               e.rpe ?? null,
                    })),
                  }
                : undefined,
            }
          }),
        },
      },
    })
  }
  console.log("✅ Templates de rutinas del sistema creados")

  // ─── Templates de planes alimenticios (Plan Inicial) ─────────────────────────
  const templatePlanes = [
    {
      nombre:            "Plan Hipertrofia — Alta proteína",
      objetivo:          "hipertrofia",
      calorias_objetivo: 2800,
      plan_requerido:    "inicial",
      dias: ORDEN_DIAS.map((dia, idx) => ({
        dia_semana:  dia,
        orden:       idx + 1,
        es_libre:    dia === "domingo",
        nombre_foco: dia === "domingo" ? null
          : dia === "sabado" ? "Recarga de carbohidratos"
          : "Entrenamiento — Alta proteína",
        comidas: dia === "domingo" ? [] : [
          { orden: 1, momento: "desayuno",     hora_sugerida: new Date("1970-01-01T07:00:00"), descripcion: "3 claras + 2 huevos revueltos con espinaca y tomate. 2 rebanadas pan integral. 1 taza avena con leche descremada.", calorias: 480, proteinas_g: 38, carbohidratos_g: 55, grasas_g: 12 },
          { orden: 2, momento: "media_manana", hora_sugerida: new Date("1970-01-01T10:30:00"), descripcion: "1 scoop de proteína en agua. 1 manzana. 20g almendras.", calorias: 280, proteinas_g: 28, carbohidratos_g: 22, grasas_g: 10 },
          { orden: 3, momento: "almuerzo",     hora_sugerida: new Date("1970-01-01T13:00:00"), descripcion: "200g pechuga de pollo a la plancha. 1 taza arroz integral. Ensalada verde con aceite de oliva. 1 plátano maduro.", calorias: 720, proteinas_g: 52, carbohidratos_g: 80, grasas_g: 14 },
          { orden: 4, momento: "merienda",     hora_sugerida: new Date("1970-01-01T16:30:00"), descripcion: "1 scoop proteína en leche. 2 galletas de arroz con mantequilla de maní.", calorias: 350, proteinas_g: 30, carbohidratos_g: 28, grasas_g: 12 },
          { orden: 5, momento: "cena",         hora_sugerida: new Date("1970-01-01T20:00:00"), descripcion: "180g carne de res magra (lomo) a la plancha. 1 taza de papa cocinada. Brócoli salteado. Ensalada de tomate.", calorias: 580, proteinas_g: 45, carbohidratos_g: 42, grasas_g: 18 },
        ],
      })),
    },
    {
      nombre:            "Plan Pérdida de Grasa — Déficit moderado",
      objetivo:          "perdida_grasa",
      calorias_objetivo: 1800,
      plan_requerido:    "inicial",
      dias: ORDEN_DIAS.map((dia, idx) => ({
        dia_semana:  dia,
        orden:       idx + 1,
        es_libre:    dia === "domingo",
        nombre_foco: dia === "domingo" ? null
          : dia === "sabado" ? "Recarga moderada"
          : "Déficit calórico — Alta saciedad",
        comidas: dia === "domingo" ? [] : [
          { orden: 1, momento: "desayuno",     hora_sugerida: new Date("1970-01-01T07:30:00"), descripcion: "Yogur griego sin azúcar (200g) con 1/2 taza de avena y frutos rojos. 1 café negro.", calorias: 320, proteinas_g: 22, carbohidratos_g: 38, grasas_g: 7 },
          { orden: 2, momento: "media_manana", hora_sugerida: new Date("1970-01-01T10:30:00"), descripcion: "1 manzana verde. 15g nueces. Té verde sin azúcar.", calorias: 175, proteinas_g: 3, carbohidratos_g: 22, grasas_g: 9 },
          { orden: 3, momento: "almuerzo",     hora_sugerida: new Date("1970-01-01T13:00:00"), descripcion: "160g pechuga de pollo o atún en agua. 1/2 taza arroz integral. Ensalada grande: lechuga, pepino, tomate, zanahoria rallada, limón.", calorias: 480, proteinas_g: 42, carbohidratos_g: 40, grasas_g: 8 },
          { orden: 4, momento: "merienda",     hora_sugerida: new Date("1970-01-01T16:30:00"), descripcion: "Batido de proteína (1 scoop) con agua y 1/2 banano pequeño.", calorias: 220, proteinas_g: 24, carbohidratos_g: 18, grasas_g: 3 },
          { orden: 5, momento: "cena",         hora_sugerida: new Date("1970-01-01T19:30:00"), descripcion: "150g tilapia o merluza al horno con limón. Ensalada de espinacas con aguacate (1/4). 1 taza de sopa de verduras.", calorias: 380, proteinas_g: 35, carbohidratos_g: 20, grasas_g: 15 },
        ],
      })),
    },
  ]

  for (const t of templatePlanes) {
    await prisma.planAlimenticio.create({
      data: {
        coach_id:          coach2.id,
        es_template:       true,
        plan_requerido:    t.plan_requerido,
        objetivo:          t.objetivo,
        nombre:            t.nombre,
        calorias_objetivo: t.calorias_objetivo,
        activo:            true,
        dias: {
          create: t.dias.map((d) => ({
            dia_semana:  d.dia_semana,
            orden:       d.orden,
            es_libre:    d.es_libre,
            nombre_foco: d.nombre_foco,
            comidas: d.comidas.length > 0 ? { create: d.comidas } : undefined,
          })),
        },
      },
    })
  }
  console.log("✅ Templates de planes alimenticios creados")

  console.log("\n🎉 Seed completado exitosamente.")
  console.log("\nCredenciales de acceso:")
  console.log("  Admin:         admin@profitmanager.app    / admin123")
  console.log("  Coach Gratis:  coach.gratis@profitmanager.app  / coach123")
  console.log("  Coach Inicial: coach.inicial@profitmanager.app / coach123")
  console.log("  Alumnos:       [email] / alumno123")
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e)
    process.exit(1)
  })
