"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dumbbell, UtensilsCrossed, Loader2, Trash2, Lock } from "lucide-react"
import { Badge } from "@/components/ui"
import type { Objetivo } from "@prisma/client"

const OBJETIVO_LABEL: Record<Objetivo, string> = {
  hipertrofia: "Hipertrofia",
  perdida_grasa: "Pérdida de grasa",
  fuerza: "Fuerza",
  resistencia: "Resistencia",
  general: "General",
}

interface RutinaTemplate {
  id: string
  nombre: string
  objetivo: Objetivo | null
  ejercicios: { id: string }[]
}

interface PlanTemplate {
  id: string
  nombre: string
  objetivo: Objetivo | null
  calorias_objetivo: number | null
  comidas: { id: string }[]
}

interface Props {
  rutinas: RutinaTemplate[]
  planes: PlanTemplate[]
}

function ConfirmarEliminarBtn({
  onConfirmar,
  cargando,
}: {
  onConfirmar: () => void
  cargando: boolean
}) {
  const [confirmando, setConfirmando] = useState(false)

  if (confirmando) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setConfirmando(false)}
          className="text-xs px-2 py-1 rounded-lg font-semibold"
          style={{ background: "var(--border)", color: "var(--foreground-muted)" }}
        >
          No
        </button>
        <button
          onClick={onConfirmar}
          disabled={cargando}
          className="text-xs px-2 py-1 rounded-lg font-semibold disabled:opacity-60"
          style={{ background: "var(--red)", color: "white" }}
        >
          {cargando ? <Loader2 size={11} className="animate-spin" /> : "Sí, eliminar"}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirmando(true)}
      className="btn-ghost p-1.5 flex-shrink-0"
      title="Eliminar template"
      style={{ color: "var(--foreground-subtle)" }}
    >
      <Trash2 size={14} />
    </button>
  )
}

export function AdminRutinaTemplateCards({ rutinas }: { rutinas: RutinaTemplate[] }) {
  const router = useRouter()
  const [eliminando, setEliminando] = useState<string | null>(null)

  async function eliminar(id: string) {
    setEliminando(id)
    try {
      const res = await fetch(`/api/admin/rutinas/${id}`, { method: "DELETE" })
      if (res.ok) router.refresh()
    } finally {
      setEliminando(null)
    }
  }

  if (rutinas.length === 0) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}>
        <Dumbbell size={28} className="mx-auto mb-2" style={{ color: "var(--foreground-subtle)" }} />
        <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>No hay rutinas template aún</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rutinas.map((r) => (
        <div
          key={r.id}
          className="rounded-2xl p-5"
          style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--blue-bg)" }}>
              <Dumbbell size={18} style={{ color: "var(--blue)" }} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-sm truncate" style={{ color: "var(--foreground)" }}>{r.nombre}</p>
                <ConfirmarEliminarBtn
                  onConfirmar={() => eliminar(r.id)}
                  cargando={eliminando === r.id}
                />
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                {r.ejercicios.length} ejercicio{r.ejercicios.length !== 1 ? "s" : ""}
              </p>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {r.objetivo && <Badge variant="blue">{OBJETIVO_LABEL[r.objetivo]}</Badge>}
                <Badge variant="neutral">
                  <Lock size={10} className="mr-1" />
                  Solo Plan Inicial
                </Badge>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function AdminPlanTemplateCards({ planes }: { planes: PlanTemplate[] }) {
  const router = useRouter()
  const [eliminando, setEliminando] = useState<string | null>(null)

  async function eliminar(id: string) {
    setEliminando(id)
    try {
      const res = await fetch(`/api/admin/planes-alimenticios/${id}`, { method: "DELETE" })
      if (res.ok) router.refresh()
    } finally {
      setEliminando(null)
    }
  }

  if (planes.length === 0) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}>
        <UtensilsCrossed size={28} className="mx-auto mb-2" style={{ color: "var(--foreground-subtle)" }} />
        <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>No hay planes template aún</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {planes.map((p) => (
        <div
          key={p.id}
          className="rounded-2xl p-5"
          style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--green-bg)" }}>
              <UtensilsCrossed size={18} style={{ color: "var(--green)" }} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-sm truncate" style={{ color: "var(--foreground)" }}>{p.nombre}</p>
                <ConfirmarEliminarBtn
                  onConfirmar={() => eliminar(p.id)}
                  cargando={eliminando === p.id}
                />
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                {p.comidas.length} comida{p.comidas.length !== 1 ? "s" : ""} · {p.calorias_objetivo ?? "—"} kcal
              </p>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {p.objetivo && <Badge variant="success">{OBJETIVO_LABEL[p.objetivo]}</Badge>}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
