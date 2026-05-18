import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFecha(fecha: Date | string, zona?: string): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha
  return d.toLocaleDateString("es-EC", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: zona ?? "America/Guayaquil",
  })
}

export function formatFechaCorta(fecha: Date | string): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha
  return d.toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function tiempoRelativo(fecha: Date | string): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha
  const ahora = new Date()
  const diff = ahora.getTime() - d.getTime()
  const minutos = Math.floor(diff / 60000)
  const horas = Math.floor(diff / 3600000)
  const dias = Math.floor(diff / 86400000)

  if (minutos < 1) return "hace un momento"
  if (minutos < 60) return `hace ${minutos} min`
  if (horas < 24) return `hace ${horas} h`
  if (dias === 1) return "ayer"
  if (dias < 7) return `hace ${dias} días`
  return formatFechaCorta(d)
}

// Genera un color de gradiente determinístico basado en el nombre
export function avatarGradient(nombre: string): string {
  const gradientes = [
    "from-orange-400 to-red-500",
    "from-blue-400 to-blue-600",
    "from-purple-400 to-purple-600",
    "from-green-400 to-green-600",
    "from-pink-400 to-pink-600",
    "from-teal-400 to-teal-600",
  ]
  const index = nombre.charCodeAt(0) % gradientes.length
  return gradientes[index]
}

export function iniciales(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase()
}
