"use client"

import Link from "next/link"
import { useState } from "react"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import type { PlanActual, EstadoPlan } from "@prisma/client"

interface Notificacion {
  id: string
  tipo: string
  titulo: string
  mensaje: string
  link: string | null
  leida: boolean
  created_at: string
}

interface AppShellProps {
  children: React.ReactNode
  rol: "coach" | "alumno" | "admin"
  nombre: string
  apellido: string
  email: string
  plan?: PlanActual
  estadoPlan?: EstadoPlan
  notificacionesSinLeer?: number
  solicitudesPendientes?: number
  notificaciones?: Notificacion[]
  zonaHoraria?: string
}

export function AppShell({
  children, rol, nombre, apellido, email,
  plan, estadoPlan, notificacionesSinLeer = 0, solicitudesPendientes = 0, notificaciones = [], zonaHoraria,
}: AppShellProps) {
  const [sidebarAbierto, setSidebarAbierto] = useState(false)

  return (
    <div
      className="flex h-dvh overflow-hidden"
      style={{ background: "var(--background)" }}
    >
      <Sidebar
        rol={rol}
        nombre={nombre}
        apellido={apellido}
        email={email}
        plan={plan}
        estadoPlan={estadoPlan}
        notificacionesSinLeer={notificacionesSinLeer}
        solicitudesPendientes={solicitudesPendientes}
        abierto={sidebarAbierto}
        onCerrar={() => setSidebarAbierto(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          nombre={nombre}
          apellido={apellido}
          rol={rol}
          notificacionesSinLeer={notificacionesSinLeer}
          notificaciones={notificaciones}
          zonaHoraria={zonaHoraria}
          onAbrirSidebar={() => setSidebarAbierto(true)}
        />

        {/* Banner modo solo lectura */}
        {estadoPlan === "solo_lectura" && (
          <div
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold"
            style={{ background: "var(--red-bg)", color: "var(--red)" }}
          >
            Tu plan venció. Acceso en modo solo lectura.{" "}
            <Link href="/coach/mi-plan" className="underline font-bold">
              Renovar →
            </Link>
          </div>
        )}

        <main
          className="flex-1 overflow-y-auto"
          style={{ background: "var(--background)" }}
        >
          <div className="mx-auto max-w-6xl px-5 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
