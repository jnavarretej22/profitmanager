"use client"

import { useState } from "react"
import { Loader2, Save, Plus } from "lucide-react"
import { formatFechaCorta } from "@/lib/utils"
import type { Medicion } from "@prisma/client"

interface MedicionFormProps {
  alumnoId: string
  onNuevaMedicion: (m: Medicion) => void
}

export function MedicionForm({ alumnoId, onNuevaMedicion }: MedicionFormProps) {
  const [abierto, setAbierto] = useState(false)
  const hoy = new Date().toISOString().split("T")[0]

  const [form, setForm] = useState({
    fecha: hoy,
    peso_kg: "",
    cintura_cm: "",
    cadera_cm: "",
    pecho_cm: "",
    brazo_cm: "",
    pierna_cm: "",
    porcentaje_grasa: "",
    notas: "",
  })
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState("")

  function setField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const body: Record<string, string | number | undefined> = {
      alumno_id: alumnoId,
      fecha: form.fecha,
      peso_kg: form.peso_kg ? parseFloat(form.peso_kg) : undefined,
      cintura_cm: form.cintura_cm ? parseFloat(form.cintura_cm) : undefined,
      cadera_cm: form.cadera_cm ? parseFloat(form.cadera_cm) : undefined,
      pecho_cm: form.pecho_cm ? parseFloat(form.pecho_cm) : undefined,
      brazo_cm: form.brazo_cm ? parseFloat(form.brazo_cm) : undefined,
      pierna_cm: form.pierna_cm ? parseFloat(form.pierna_cm) : undefined,
      porcentaje_grasa: form.porcentaje_grasa ? parseFloat(form.porcentaje_grasa) : undefined,
      notas: form.notas || undefined,
    }

    setCargando(true)
    try {
      const res = await fetch("/api/mediciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.mensaje ?? "Error al guardar medición")
        return
      }

      onNuevaMedicion(data.medicion)
      setAbierto(false)
      setForm({ fecha: hoy, peso_kg: "", cintura_cm: "", cadera_cm: "", pecho_cm: "", brazo_cm: "", pierna_cm: "", porcentaje_grasa: "", notas: "" })
    } catch {
      setError("Error de conexión")
    } finally {
      setCargando(false)
    }
  }

  if (!abierto) {
    return (
      <button onClick={() => setAbierto(true)} className="btn-primary">
        <Plus size={16} />
        Nueva medición
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl p-5 space-y-4"
      style={{
        background: "var(--background-card)",
        border: "2px solid var(--blue)",
        boxShadow: "0 0 0 3px var(--blue-bg)",
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
          Nueva medición
        </h3>
        <button type="button" onClick={() => setAbierto(false)} className="btn-ghost text-xs py-1 px-2">
          Cancelar
        </button>
      </div>

      {error && (
        <p className="text-sm" style={{ color: "var(--red)" }}>{error}</p>
      )}

      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--foreground)" }}>
          Fecha *
        </label>
        <input
          type="date"
          value={form.fecha}
          onChange={(e) => setField("fecha", e.target.value)}
          required
          className="input-base"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { key: "peso_kg", label: "Peso (kg)" },
          { key: "porcentaje_grasa", label: "% Grasa" },
          { key: "cintura_cm", label: "Cintura (cm)" },
          { key: "cadera_cm", label: "Cadera (cm)" },
          { key: "pecho_cm", label: "Pecho (cm)" },
          { key: "brazo_cm", label: "Brazo (cm)" },
          { key: "pierna_cm", label: "Pierna (cm)" },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--foreground)" }}>
              {label}
            </label>
            <input
              type="number"
              step="0.01"
              value={form[key as keyof typeof form]}
              onChange={(e) => setField(key, e.target.value)}
              placeholder="—"
              className="input-base"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--foreground)" }}>
          Notas
        </label>
        <textarea
          value={form.notas}
          onChange={(e) => setField("notas", e.target.value)}
          rows={2}
          placeholder="Observaciones adicionales..."
          className="input-base resize-none"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button type="submit" disabled={cargando} className="btn-primary disabled:opacity-60">
          {cargando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Guardar medición
        </button>
      </div>
    </form>
  )
}

// ─── Tabla historial ──────────────────────────────────────────────────────────

interface HistorialMedicionesProps {
  mediciones: Medicion[]
}

export function HistorialMediciones({ mediciones }: HistorialMedicionesProps) {
  if (mediciones.length === 0) {
    return (
      <p className="py-6 text-center text-sm" style={{ color: "var(--foreground-muted)" }}>
        Sin mediciones registradas aún
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["Fecha", "Peso (kg)", "% Grasa", "Cintura", "Cadera", "Pecho", "Brazo", "Pierna"].map((h) => (
              <th
                key={h}
                className="py-2.5 px-3 text-left text-xs font-semibold"
                style={{ color: "var(--foreground-muted)" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
          {mediciones.map((m) => (
            <tr key={m.id} className="hover:bg-[var(--background-hover)] transition-colors">
              <td className="py-3 px-3 font-medium" style={{ color: "var(--foreground)" }}>
                {formatFechaCorta(m.fecha)}
              </td>
              {[m.peso_kg, m.porcentaje_grasa, m.cintura_cm, m.cadera_cm, m.pecho_cm, m.brazo_cm, m.pierna_cm].map((v, i) => (
                <td key={i} className="py-3 px-3" style={{ color: v ? "var(--foreground)" : "var(--foreground-subtle)" }}>
                  {v != null ? Number(v).toFixed(1) : "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
