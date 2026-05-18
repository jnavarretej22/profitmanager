/**
 * Rate limiting simple con cache en memoria (por proceso).
 * Para producción multi-instancia usar Upstash Redis o similar.
 * Suficiente para el MVP en Vercel serverless (cada instancia tiene su propio estado).
 */

interface Intento {
  count: number
  windowStart: number
}

const cache = new Map<string, Intento>()

// Limpiar entradas expiradas periódicamente
setInterval(() => {
  const ahora = Date.now()
  for (const [key, val] of cache.entries()) {
    if (ahora - val.windowStart > 60_000 * 60) cache.delete(key) // limpiar si >1h
  }
}, 60_000 * 10) // cada 10 min

interface RateLimitOptions {
  windowMs:  number  // ventana en ms (ej. 60_000 = 1 min)
  max:       number  // máximo de intentos en la ventana
}

interface RateLimitResult {
  allowed:   boolean
  remaining: number
  resetMs:   number  // ms hasta que la ventana se reinicia
}

export function checkRateLimit(
  identifier: string,  // IP + ruta
  options: RateLimitOptions
): RateLimitResult {
  const ahora = Date.now()
  const entry  = cache.get(identifier)

  if (!entry || ahora - entry.windowStart >= options.windowMs) {
    // Nueva ventana
    cache.set(identifier, { count: 1, windowStart: ahora })
    return { allowed: true, remaining: options.max - 1, resetMs: options.windowMs }
  }

  if (entry.count >= options.max) {
    return {
      allowed:   false,
      remaining: 0,
      resetMs:   options.windowMs - (ahora - entry.windowStart),
    }
  }

  entry.count++
  cache.set(identifier, entry)
  return {
    allowed:   true,
    remaining: options.max - entry.count,
    resetMs:   options.windowMs - (ahora - entry.windowStart),
  }
}

// Configuraciones por ruta
export const RATE_LIMITS = {
  login:     { windowMs: 15 * 60_000, max: 10  }, // 10 intentos por 15 min
  registro:  { windowMs: 60 * 60_000, max: 5   }, // 5 registros por hora por IP
  reset:     { windowMs: 60 * 60_000, max: 5   }, // 5 resets por hora por IP
  solicitud: { windowMs: 60 * 60_000, max: 3   }, // 3 solicitudes de inscripción por hora por IP
} as const
