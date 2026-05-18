"use client"

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
  const hoy = formatFecha(new Date(), zonaHoraria)

  return (
    <header
      className="flex items-center justify-between px-5 py-3.5 border-b"
      style={{
        background: "var(--background-card)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-xs)",
      }}
    >
      <div className="flex items-center gap-3">
        {/* Hamburguesa mobile */}
        <button
          onClick={onAbrirSidebar}
          className="btn-ghost md:hidden"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>

        <div>
          <h2
            className="text-sm font-bold leading-tight"
            style={{ color: "var(--foreground)", letterSpacing: "-0.01em" }}
          >
            {getSaludo(nombre)}
          </h2>
          <p className="text-xs capitalize" style={{ color: "var(--foreground-muted)" }}>
            {hoy}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle size="sm" />

        {/* Panel de notificaciones */}
        <NotificacionesPanel
          notificacionesSinLeer={notificacionesSinLeer}
          notificaciones={notificaciones}
          rol={rol}
        />

        {/* Avatar */}
        <Avatar nombre={nombre} apellido={apellido} size="sm" />
      </div>
    </header>
  )
}
