"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Minus, X, Loader2, ChevronDown, Coffee } from "lucide-react"

type Estado = "completada" | "parcial" | "no_realizada"

type LogExistente = {
  estado: Estado
  energia: number | null
  notas: string | null
} | null

interface Props {
  diaRutinaIdHoy: string | null
  esHoyDescanso:  boolean
  nombreFocoHoy:  string | null
  logExistente:   LogExistente
  fechaHoy:       string
}

const ESTADO_LABEL: Record<Estado, string> = {
  completada:   "Completada",
  parcial:      "Parcial",
  no_realizada: "No pude entrenar",
}

export function CheckInRutina({
  diaRutinaIdHoy, esHoyDescanso, nombreFocoHoy, logExistente, fechaHoy,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [enviando, setEnviando]      = useState(false)
  const [expandido, setExpandido]    = useState(false)
  const [energia, setEnergia]        = useState<number | null>(logExistente?.energia ?? null)
  const [notas, setNotas]            = useState(logExistente?.notas ?? "")

  if (esHoyDescanso) {
    return (
      <div className="rounded-2xl p-5 flex items-center gap-3" style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}>
        <Coffee size={20} style={{ color: "var(--foreground-subtle)" }} />
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Hoy es día de descanso</p>
          <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>Descansa bien y recupera fuerzas.</p>
        </div>
      </div>
    )
  }

  if (!diaRutinaIdHoy) return null

  async function registrar(estado: Estado) {
    setEnviando(true)
    try {
      const res = await fetch("/api/alumno/sesiones-rutina", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dia_rutina_id: diaRutinaIdHoy,
          fecha:         fechaHoy,
          estado,
          energia:       energia ?? undefined,
          notas:         notas.trim() || undefined,
        }),
      })
      if (res.ok) startTransition(() => router.refresh())
    } finally {
      setEnviando(false)
    }
  }

  async function deshacer() {
    setEnviando(true)
    try {
      const url = `/api/alumno/sesiones-rutina?dia_rutina_id=${diaRutinaIdHoy}&fecha=${fechaHoy}`
      const res = await fetch(url, { method: "DELETE" })
      if (res.ok) {
        setEnergia(null)
        setNotas("")
        setExpandido(false)
        startTransition(() => router.refresh())
      }
    } finally {
      setEnviando(false)
    }
  }

  const ocupado = enviando || isPending

  // Estado actual: ya logeado
  if (logExistente) {
    const colorEstado =
      logExistente.estado === "completada"   ? "var(--green)" :
      logExistente.estado === "parcial"      ? "var(--orange)" :
                                               "var(--red)"
    const bgEstado =
      logExistente.estado === "completada"   ? "var(--green-bg)" :
      logExistente.estado === "parcial"      ? "var(--orange-bg)" :
                                               "var(--red-bg, #FEF2F2)"
    const Icon =
      logExistente.estado === "completada"   ? Check :
      logExistente.estado === "parcial"      ? Minus :
                                               X

    return (
      <div className="rounded-2xl p-5" style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: bgEstado }}>
            <Icon size={18} style={{ color: colorEstado }} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--foreground-subtle)" }}>
              Check-in de hoy
            </p>
            <p className="font-bold text-sm" style={{ color: colorEstado }}>
              {ESTADO_LABEL[logExistente.estado]}
              {nombreFocoHoy && <span style={{ color: "var(--foreground-muted)", fontWeight: 500 }}> · {nombreFocoHoy}</span>}
            </p>
            {logExistente.energia != null && (
              <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
                Energía: {"★".repeat(logExistente.energia)}{"☆".repeat(5 - logExistente.energia)}
              </p>
            )}
            {logExistente.notas && (
              <p className="text-xs mt-1 italic" style={{ color: "var(--foreground-muted)" }}>
                "{logExistente.notas}"
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={deshacer}
            disabled={ocupado}
            className="text-xs font-semibold underline disabled:opacity-50"
            style={{ color: "var(--foreground-subtle)" }}
          >
            {ocupado ? "..." : "Deshacer"}
          </button>
        </div>
      </div>
    )
  }

  // No logeado todavía: mostrar botones
  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--foreground-subtle)" }}>
            Check-in de hoy
          </p>
          <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
            ¿Cómo te fue con la sesión?
            {nombreFocoHoy && <span style={{ color: "var(--foreground-muted)", fontWeight: 500 }}> · {nombreFocoHoy}</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpandido((v) => !v)}
          className="text-xs flex items-center gap-1"
          style={{ color: "var(--foreground-subtle)" }}
        >
          Detalle <ChevronDown size={12} style={{ transform: expandido ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
        </button>
      </div>

      {expandido && (
        <div className="space-y-2 mb-3 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--foreground-subtle)" }}>
              Energía hoy
            </p>
            <div className="flex gap-1">
              {[1,2,3,4,5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setEnergia(energia === n ? null : n)}
                  className="text-lg leading-none"
                  style={{ color: energia != null && n <= energia ? "var(--orange)" : "var(--foreground-subtle)" }}
                  aria-label={`Energía ${n}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="¿Cómo te sentiste? (opcional)"
            maxLength={500}
            rows={2}
            className="w-full rounded-lg px-3 py-2 text-sm resize-none"
            style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          />
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => registrar("completada")}
          disabled={ocupado}
          className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition disabled:opacity-60"
          style={{ background: "var(--green)", color: "white", boxShadow: "0 3px 10px rgba(34,197,94,0.3)" }}
        >
          {ocupado ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> Completada</>}
        </button>
        <button
          type="button"
          onClick={() => registrar("parcial")}
          disabled={ocupado}
          className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition disabled:opacity-60"
          style={{ background: "var(--orange-bg)", color: "var(--orange)", border: "1px solid var(--orange)" }}
        >
          <Minus size={14} /> Parcial
        </button>
        <button
          type="button"
          onClick={() => registrar("no_realizada")}
          disabled={ocupado}
          className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition disabled:opacity-60"
          style={{ background: "var(--red-bg, #FEF2F2)", color: "var(--red)", border: "1px solid var(--red)" }}
        >
          <X size={14} /> No pude
        </button>
      </div>
    </div>
  )
}
