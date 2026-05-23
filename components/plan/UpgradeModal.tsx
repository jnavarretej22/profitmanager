"use client"

import { X, Zap, Check } from "lucide-react"
import Link from "next/link"

interface UpgradeModalProps {
  abierto: boolean
  onCerrar: () => void
  feature?: string
}

const BENEFICIOS = [
  "Hasta 10 alumnos activos",
  "Templates de rutinas por objetivo",
  "Templates de dietas con comida LATAM",
  "Gráficas de progreso detalladas",
  "Citas con Google Meet automático",
  "PDFs con tu logo, sin marca de agua",
]

export function UpgradeModal({ abierto, onCerrar, feature }: UpgradeModalProps) {
  if (!abierto) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
        onClick={onCerrar}
      >
        {/* Modal */}
        <div
          className="relative w-full max-w-sm rounded-2xl p-7 animate-scale-in"
          style={{
            background: "var(--background-card)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-lg)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onCerrar}
            className="btn-ghost absolute right-4 top-4 p-1.5"
          >
            <X size={16} />
          </button>

          {/* Ícono */}
          <div
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: "linear-gradient(135deg, #2D7DF6, #8B5CF6)" }}
          >
            <Zap size={22} color="white" />
          </div>

          <h2
            className="text-xl font-bold mb-1"
            style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
          >
            Función del Plan Inicial
          </h2>
          <p className="text-sm mb-5" style={{ color: "var(--foreground-muted)" }}>
            {feature
              ? `"${feature}" está disponible en el Plan Inicial.`
              : "Esta función está disponible en el Plan Inicial."}{" "}
            Actualiza para desbloquear:
          </p>

          <ul className="space-y-2 mb-6">
            {BENEFICIOS.map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground-muted)" }}>
                <Check size={14} style={{ color: "var(--blue)", flexShrink: 0 }} />
                {b}
              </li>
            ))}
          </ul>

          <div className="space-y-2">
            <Link
              href="/coach/mi-plan"
              onClick={onCerrar}
              className="btn-primary w-full justify-center py-3"
              style={{ display: "flex" }}
            >
              Ver Plan Inicial — $15/mes
            </Link>
            <button
              onClick={onCerrar}
              className="btn-ghost w-full justify-center text-sm py-2"
              style={{ display: "flex" }}
            >
              Continuar con plan Gratis
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
