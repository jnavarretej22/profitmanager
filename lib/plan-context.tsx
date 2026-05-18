"use client"

import { createContext, useContext } from "react"
import type { PlanActual, EstadoPlan } from "@prisma/client"
import { PlanFeatureService, type Feature } from "./plan-features"

interface PlanContextValue {
  plan: PlanActual
  estadoPlan: EstadoPlan
  limiteAlumnos: number
  totalAlumnos: number
  tieneFeature: (feature: Feature) => boolean
  esSoloLectura: boolean
  puedeAgregarAlumno: boolean
}

const PlanContext = createContext<PlanContextValue | null>(null)

export function PlanProvider({
  children,
  plan,
  estadoPlan,
  totalAlumnos,
}: {
  children: React.ReactNode
  plan: PlanActual
  estadoPlan: EstadoPlan
  totalAlumnos: number
}) {
  const limiteAlumnos = PlanFeatureService.limiteAlumnos(plan)
  const esSoloLectura = PlanFeatureService.esSoloLectura(estadoPlan)

  const value: PlanContextValue = {
    plan,
    estadoPlan,
    limiteAlumnos,
    totalAlumnos,
    tieneFeature: (feature) => PlanFeatureService.tieneFeature(plan, feature),
    esSoloLectura,
    puedeAgregarAlumno: !esSoloLectura && totalAlumnos < limiteAlumnos,
  }

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext)
  if (!ctx) throw new Error("usePlan debe usarse dentro de <PlanProvider>")
  return ctx
}
