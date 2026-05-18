// Utilidades para generación y validación de slugs de perfil público

export const SLUGS_RESERVADOS = new Set([
  "login", "registro", "admin", "coach", "alumno", "api",
  "terminos", "privacidad", "recuperar-contrasena", "nueva-contrasena",
  "auth", "notificaciones", "perfil", "rutinas", "agenda",
  "planes-alimenticios", "alumnos", "mi-plan", "reportes",
  "favicon.ico", "_next", "static", "images", "fonts",
])

export function generarSlug(nombre: string, apellido: string): string {
  const texto = `${nombre}-${apellido}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar tildes
    .replace(/[^a-z0-9\s-]/g, "")   // solo alfanumérico y guiones
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 70)

  if (SLUGS_RESERVADOS.has(texto)) return `${texto}-coach`
  return texto
}

export function validarSlug(slug: string): { valido: boolean; error?: string } {
  if (!slug) return { valido: false, error: "El slug no puede estar vacío" }
  if (slug.length < 3) return { valido: false, error: "Mínimo 3 caracteres" }
  if (slug.length > 80) return { valido: false, error: "Máximo 80 caracteres" }
  if (!/^[a-z0-9-]+$/.test(slug)) return { valido: false, error: "Solo letras minúsculas, números y guiones" }
  if (slug.startsWith("-") || slug.endsWith("-")) return { valido: false, error: "No puede comenzar ni terminar con guión" }
  if (SLUGS_RESERVADOS.has(slug)) return { valido: false, error: "Esta URL está reservada por el sistema" }
  return { valido: true }
}
