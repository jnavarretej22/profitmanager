"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2, X, DollarSign } from "lucide-react"

interface Coach { id: string; nombre: string; email: string }

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>{children}</label>
  )
}

export function RegistrarPagoModal({ coaches }: { coaches: Coach[] }) {
  const [abierto, setAbierto] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState("")
  const [ok, setOk] = useState(false)
  const router = useRouter()

  const [form, setForm] = useState({
    coach_id:        "",
    plan_nuevo:      "inicial" as "gratis" | "inicial",
    periodicidad:    "mensual" as "mensual" | "anual",
    monto:           "15",
    metodo:          "transferencia" as "transferencia" | "deposito" | "otro",
    fecha_pago:      new Date().toISOString().slice(0, 10),
    periodo_desde:   new Date().toISOString().slice(0, 10),
    periodo_hasta:   (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().slice(0, 10) })(),
    comprobante_url: "",
    notas:           "",
  })

  function set(k: string, v: string) {
    setForm((p) => {
      const next = { ...p, [k]: v }
      // Calcular periodo_hasta automáticamente
      if ((k === "periodo_desde" || k === "periodicidad") && next.periodo_desde) {
        const inicio = new Date(next.periodo_desde)
        if (next.periodicidad === "mensual") {
          inicio.setMonth(inicio.getMonth() + 1)
        } else {
          inicio.setFullYear(inicio.getFullYear() + 1)
        }
        next.periodo_hasta = inicio.toISOString().slice(0, 10)
        next.monto = next.periodicidad === "anual" ? "144" : "15"
      }
      return next
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.coach_id) { setError("Selecciona un coach"); return }
    setError(""); setCargando(true)
    try {
      const res = await fetch("/api/admin/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          monto: parseFloat(form.monto),
          fecha_pago:    new Date(form.fecha_pago).toISOString(),
          periodo_desde: new Date(form.periodo_desde).toISOString(),
          periodo_hasta: new Date(form.periodo_hasta).toISOString(),
          comprobante_url: form.comprobante_url || null,
          notas: form.notas || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Error al registrar pago"); return }
      setOk(true)
      router.refresh()
      setTimeout(() => { setAbierto(false); setOk(false) }, 1500)
    } catch { setError("Error de conexión") }
    finally { setCargando(false) }
  }

  return (
    <>
      <button onClick={() => setAbierto(true)} className="btn-primary">
        <Plus size={16} /> Registrar pago
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div
            className="w-full max-w-lg max-h-[90vh] rounded-2xl flex flex-col"
            style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-xl)" }}
          >
            {/* Header fijo — nunca se desplaza */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0 border-b" style={{ borderColor: "var(--border)" }}>
              <h2 className="text-lg font-bold" style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}>
                Registrar pago
              </h2>
              <button onClick={() => setAbierto(false)} className="btn-ghost p-1.5" style={{ color: "var(--foreground-muted)" }}>
                <X size={18} />
              </button>
            </div>

            {/* Cuerpo desplazable */}
            <div className="overflow-y-auto px-6 py-5 flex-1">
            {ok ? (
              <div className="py-8 text-center">
                <DollarSign size={36} className="mx-auto mb-3" style={{ color: "var(--green)" }} />
                <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>¡Pago registrado!</p>
                <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>El plan del coach ha sido actualizado.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <Label>Coach *</Label>
                  <select value={form.coach_id} onChange={(e) => set("coach_id", e.target.value)} className="input-base" required>
                    <option value="">Seleccionar coach...</option>
                    {coaches.map((c) => <option key={c.id} value={c.id}>{c.nombre} — {c.email}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Plan nuevo</Label>
                    <select value={form.plan_nuevo} onChange={(e) => set("plan_nuevo", e.target.value)} className="input-base">
                      <option value="inicial">Inicial</option>
                      <option value="gratis">Gratis</option>
                    </select>
                  </div>
                  <div>
                    <Label>Periodicidad</Label>
                    <select value={form.periodicidad} onChange={(e) => set("periodicidad", e.target.value)} className="input-base">
                      <option value="mensual">Mensual ($15)</option>
                      <option value="anual">Anual ($144)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Monto (USD) *</Label>
                    <input type="number" min="0" step="0.01" value={form.monto} onChange={(e) => set("monto", e.target.value)} className="input-base" required />
                  </div>
                  <div>
                    <Label>Método</Label>
                    <select value={form.metodo} onChange={(e) => set("metodo", e.target.value)} className="input-base">
                      <option value="transferencia">Transferencia</option>
                      <option value="deposito">Depósito</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Fecha de pago *</Label>
                  <input type="date" value={form.fecha_pago} onChange={(e) => set("fecha_pago", e.target.value)} className="input-base" required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Período desde *</Label>
                    <input type="date" value={form.periodo_desde} onChange={(e) => set("periodo_desde", e.target.value)} className="input-base" required />
                  </div>
                  <div>
                    <Label>Período hasta *</Label>
                    <input type="date" value={form.periodo_hasta} onChange={(e) => set("periodo_hasta", e.target.value)} className="input-base" required />
                  </div>
                </div>

                <div>
                  <Label>URL del comprobante</Label>
                  <input type="url" value={form.comprobante_url} onChange={(e) => set("comprobante_url", e.target.value)} placeholder="https://..." className="input-base" />
                </div>

                <div>
                  <Label>Notas</Label>
                  <textarea value={form.notas} onChange={(e) => set("notas", e.target.value)} rows={2} className="input-base resize-none" />
                </div>

                {error && <p className="text-sm" style={{ color: "var(--red)" }}>{error}</p>}

                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setAbierto(false)} className="btn-secondary">Cancelar</button>
                  <button type="submit" disabled={cargando} className="btn-primary disabled:opacity-60">
                    {cargando ? <Loader2 size={15} className="animate-spin" /> : <DollarSign size={15} />}
                    Registrar pago
                  </button>
                </div>
              </form>
            )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
