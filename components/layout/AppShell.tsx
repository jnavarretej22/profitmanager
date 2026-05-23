"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import type { PlanActual, EstadoPlan } from "@prisma/client"

const SIDEBAR_OCULTO_KEY = "profitmanager:sidebarOcultoDesktop"

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
  // drawer mobile (<md) — siempre vuelve a false al montar
  const [sidebarAbierto, setSidebarAbierto] = useState(false)
  // oculto desktop (>=md) — persistido en localStorage
  const [sidebarOcultoDesktop, setSidebarOcultoDesktop] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    setSidebarOcultoDesktop(window.localStorage.getItem(SIDEBAR_OCULTO_KEY) === "true")

    // Sincronizar entre pestañas: si el usuario cambia el toggle en otra pestaña,
    // esta se entera y refleja el cambio sin necesidad de refresh.
    function onStorage(e: StorageEvent) {
      if (e.key === SIDEBAR_OCULTO_KEY) {
        setSidebarOcultoDesktop(e.newValue === "true")
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  function toggleDesktop() {
    setSidebarOcultoDesktop((v) => {
      const next = !v
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SIDEBAR_OCULTO_KEY, String(next))
      }
      return next
    })
  }

  function handleToggle() {
    // En desktop oculta/muestra el sidebar fijo. En mobile abre/cierra el drawer.
    // Tailwind md = 768px.
    if (typeof window === "undefined") return
    if (window.innerWidth >= 768) {
      toggleDesktop()
    } else {
      setSidebarAbierto((v) => !v)
    }
  }

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
        ocultoDesktop={sidebarOcultoDesktop}
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
          onAbrirSidebar={handleToggle}
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
          <div className="mx-auto max-w-6xl px-3 sm:px-5 py-4 sm:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
