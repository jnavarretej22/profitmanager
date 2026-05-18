import { PlanActual, EstadoPlan } from "@prisma/client"

// ─── Definición de features ───────────────────────────────────────────────────

export const FEATURES = {
  registrar_alumnos:           "registrar_alumnos",
  crud_alumnos:                "crud_alumnos",
  rutinas_manuales:            "rutinas_manuales",
  template_dieta_generica:     "template_dieta_generica",
  citas_basicas:               "citas_basicas",
  mediciones:                  "mediciones",
  templates_rutinas:           "templates_rutinas",
  templates_dietas_objetivo:   "templates_dietas_objetivo",
  meet_automatico:             "meet_automatico",
  graficas_progreso:           "graficas_progreso",
  exportar_pdf_sin_marca:      "exportar_pdf_sin_marca",
  logo_en_pdf:                 "logo_en_pdf",
  marca_agua_alumno:           "marca_agua_alumno",
} as const

export type Feature = keyof typeof FEATURES

// ─── Límites por plan ─────────────────────────────────────────────────────────

export const LIMITES_ALUMNOS: Record<PlanActual, number> = {
  gratis:     3,
  inicial:    10,
  medio:      30,
  medio_plus: 80,
  ilimitado:  999999,
}

// ─── Definición de planes ─────────────────────────────────────────────────────

type PlanDefinicion = {
  nombre: string
  precio_mensual_usd: number | null
  precio_anual_usd: number | null
  disponible: boolean
  features: Set<Feature>
}

export const PLANES: Record<PlanActual, PlanDefinicion> = {
  gratis: {
    nombre: "Gratis",
    precio_mensual_usd: 0,
    precio_anual_usd: null,
    disponible: true,
    features: new Set<Feature>([
      "registrar_alumnos",
      "crud_alumnos",
      "rutinas_manuales",
      "template_dieta_generica",
      "citas_basicas",
      "mediciones",
      "marca_agua_alumno",
    ]),
  },

  inicial: {
    nombre: "Inicial",
    precio_mensual_usd: 15,
    precio_anual_usd: 144,
    disponible: true,
    features: new Set<Feature>([
      "registrar_alumnos",
      "crud_alumnos",
      "rutinas_manuales",
      "template_dieta_generica",
      "citas_basicas",
      "mediciones",
      "templates_rutinas",
      "templates_dietas_objetivo",
      "meet_automatico",
      "graficas_progreso",
      "exportar_pdf_sin_marca",
      "logo_en_pdf",
    ]),
  },

  medio: {
    nombre: "Medio",
    precio_mensual_usd: null,
    precio_anual_usd: null,
    disponible: false,
    features: new Set<Feature>([]),
  },

  medio_plus: {
    nombre: "Medio Plus",
    precio_mensual_usd: null,
    precio_anual_usd: null,
    disponible: false,
    features: new Set<Feature>([]),
  },

  ilimitado: {
    nombre: "Ilimitado",
    precio_mensual_usd: null,
    precio_anual_usd: null,
    disponible: false,
    features: new Set<Feature>([]),
  },
}

// ─── Servicio principal ───────────────────────────────────────────────────────

export class PlanFeatureService {
  static tieneFeature(plan: PlanActual, feature: Feature): boolean {
    return PLANES[plan].features.has(feature)
  }

  static limiteAlumnos(plan: PlanActual): number {
    return LIMITES_ALUMNOS[plan]
  }

  static planesDisponibles(): Array<{ plan: PlanActual } & PlanDefinicion> {
    return Object.entries(PLANES)
      .filter(([, def]) => def.disponible)
      .map(([plan, def]) => ({ plan: plan as PlanActual, ...def }))
  }

  static planesProximamente(): Array<{ plan: PlanActual } & PlanDefinicion> {
    return Object.entries(PLANES)
      .filter(([, def]) => !def.disponible)
      .map(([plan, def]) => ({ plan: plan as PlanActual, ...def }))
  }

  static esSoloLectura(estadoPlan: EstadoPlan): boolean {
    return estadoPlan === "solo_lectura"
  }

  static getNombrePlan(plan: PlanActual): string {
    return PLANES[plan].nombre
  }
}
