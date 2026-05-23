"use client"

import { useEffect, useState } from "react"
import { Menu } from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { NotificacionesPanel } from "./NotificacionesPanel"
import { formatFecha } from "@/lib/utils"

interface Notificacion {
  id: string
  tipo: string
  titulo: string
  mensaje: string
  link: string | null
  leida: boolean
  created_at: string
}

interface TopbarProps {
  nombre: string
  apellido: string
  rol: "coach" | "alumno" | "admin"
  notificacionesSinLeer?: number
  notificaciones?: Notificacion[]
  zonaHoraria?: string
  onAbrirSidebar: () => void
}

function getSaludo(nombre: string): string {
  const hora = new Date().getHours()
  const momento = hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches"
  return `${momento}, ${nombre}`
}

export function Topbar({
  nombre, apellido, rol, notificacionesSinLeer = 0, notificaciones = [], zonaHoraria, onAbrirSidebar,
}: TopbarProps) {
  // Se computan en cliente para evitar hydration mismatch (new Date() difiere entre server y cliente).
  const [saludo, setSaludo] = useState(`Hola, ${nombre}`)
  const [hoy, setHoy]       = useState("")

  useEffect(() => {
    setSaludo(getSaludo(nombre))
    setHoy(formatFecha(new Date(), zonaHoraria))
  }, [nombre, zonaHoraria])

  return (
    <div className="sticky top-3 z-30 px-3 sm:px-4">
      <header
        className="flex items-center justify-between mx-auto max-w-5xl px-4 sm:px-5 py-2.5 rounded-full border"
        style={{
          background: "color-mix(in srgb, var(--background-card) 88%, transparent)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Hamburguesa: en mobile abre el drawer, en desktop oculta/muestra el sidebar fijo */}
          <button
            onClick={onAbrirSidebar}
            className="btn-ghost p-1.5 flex-shrink-0"
            aria-label="Alternar menú lateral"
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0">
            <h2
              className="text-sm font-bold leading-tight truncate"
              style={{ color: "var(--foreground)", letterSpacing: "-0.01em" }}
            >
              {saludo}
            </h2>
            <p className="text-xs capitalize truncate" style={{ color: "var(--foreground-muted)" }}>
              {hoy}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <ThemeToggle size="sm" />
          <NotificacionesPanel
            notificacionesSinLeer={notificacionesSinLeer}
            notificaciones={notificaciones}
            rol={rol}
          />
          <Avatar nombre={nombre} apellido={apellido} size="sm" />
        </div>
      </header>
    </div>
  )
}
