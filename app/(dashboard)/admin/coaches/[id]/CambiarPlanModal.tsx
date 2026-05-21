"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, X, ArrowUpCircle, ArrowDownCircle, Calendar } from "lucide-react"
import { toast } from "sonner"

interface Props {
  coachId:          string
  planActual:       string
  estadoActual:     string
  fechaVencimiento: string | null  // ISO string
}

export function CambiarPlanModal({ coachId, planActual, estadoActual, fechaVencimiento }: Props) {
  const [abierto, setAbierto]           = useState(false)
  const [cargando, setCargando]         = useState(false)
  const [nuevoPlan, setNuevoPlan]       = useState<"gratis" | "inicial">(planActual as "gratis" | "inicial")
  const [periodicidad, setPeriodicidad] = useState<"mensual" | "anual">("mensual")
  const [nuevoEstado, setNuevoEstado]   = useState<"activo" | "solo_lectura">(
    estadoActual === "solo_lectura" ? "solo_lectura" : "activo"
  )
  const [fechaVenc, setFechaVenc]       = useState<string>(() => {
    if (fechaVencimiento) return fechaVencimiento.split("T")[0]
    // Por defecto: hoy + 1 mes
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    return d.toISOString().split("T")[0]
  })
  const [motivo, setMotivo]             = useState("")

  const router = useRouter()

  function calcularFecha(tipo: "mes" | "anio") {
    const d = new Date()
    if (tipo === "mes") d.setMonth(d.getMonth() + 1)
    else d.setFullYear(d.getFullYear() + 1)
    return d.toISOString().split("T")[0]
  }

  async function guardar() {
    setCargando(true)
    try {
      const body: Record<string, unknown> = {
        plan_actual:   nuevoPlan,
        estado_plan:   nuevoEstado,
        motivo:        motivo || undefined,
      }

      if (nuevoPlan === "inicial") {
        body.periodicidad      = periodicidad
        body.fecha_vencimiento = fechaVenc ? new Date(fechaVenc).toISOString() : null
      } else {
        // Al pasar a gratis: quitar fecha de vencimiento y estado activo por defecto
        body.fecha_vencimiento = null
        body.periodicidad      = null
      }

      const res = await fetch(`/api/admin/coaches/${coachId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.mensaje ?? "Error al actualizar el plan")
        return
      }

      toast.success("Plan actualizado correctamente")
      setAbierto(false)
      router.refresh()
    } catch {
      toast.error("Error de conexión")
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="btn-primary text-xs flex items-center gap-1.5"
      >
        <ArrowUpCircle size={13} />
        Cambiar plan
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setAbierto(false) }}
        >
          <div
            className="w-full max-w-md rounded-2xl flex flex-col max-h-[90vh]"
            style={{
              background: "var(--background-card)",
              border:     "1px solid var(--border)",
              boxShadow:  "var(--shadow-lg)",
            }}
          >
            {/* Header fijo */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0 border-b" style={{ borderColor: "var(--border)" }}>
              <h2 className="text-base font-bold" style={{ color: "var(--foreground)" }}>
                Cambiar plan del coach
              </h2>
              <button
                onClick={() => setAbierto(false)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: "var(--foreground-muted)", background: "var(--gray-100)" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Cuerpo desplazable */}
            <div className="overflow-y-auto px-6 py-5 space-y-5 flex-1">

            {/* Selector de plan */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--foreground-muted)" }}>Plan</p>
              <div className="grid grid-cols-2 gap-3">
                {(["gratis", "inicial"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setNuevoPlan(p)}
                    className="rounded-xl border-2 p-3 text-left transition-all"
                    style={{
                      borderColor: nuevoPlan === p ? "var(--blue)"    : "var(--border)",
                      background:  nuevoPlan === p ? "var(--blue-bg)" : "var(--background-card)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      {p === "gratis"
                        ? <ArrowDownCircle size={14} style={{ color: nuevoPlan === p ? "var(--blue)" : "var(--foreground-muted)" }} />
                        : <ArrowUpCircle  size={14} style={{ color: nuevoPlan === p ? "var(--blue)" : "var(--foreground-muted)" }} />
                      }
                      <span className="text-sm font-bold capitalize" style={{ color: nuevoPlan === p ? "var(--blue)" : "var(--foreground)" }}>
                        {p === "gratis" ? "Gratis" : "Inicial"}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                      {p === "gratis" ? "0 USD · hasta 3 alumnos" : "$15 USD/mes · hasta 10 alumnos"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Opciones del plan Inicial */}
            {nuevoPlan === "inicial" && (
              <>
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--foreground-muted)" }}>Periodicidad</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(["mensual", "anual"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setPeriodicidad(p)
                          setFechaVenc(calcularFecha(p === "mensual" ? "mes" : "anio"))
                        }}
                        className="rounded-xl border-2 py-2.5 text-center text-sm font-semibold transition-all"
                        style={{
                          borderColor: periodicidad === p ? "var(--blue)"    : "var(--border)",
                          background:  periodicidad === p ? "var(--blue-bg)" : "var(--background-card)",
                          color:       periodicidad === p ? "var(--blue)"    : "var(--foreground)",
                        }}
                      >
                        {p === "mensual" ? "Mensual" : "Anual"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                    <Calendar size={12} className="inline mr-1" />
                    Fecha de vencimiento
                  </label>
                  <input
                    type="date"
                    value={fechaVenc}
                    onChange={(e) => setFechaVenc(e.target.value)}
                    className="input-base"
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--foreground-muted)" }}>Estado del plan</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(["activo", "solo_lectura"] as const).map((e) => (
                      <button
                        key={e}
                        onClick={() => setNuevoEstado(e)}
                        className="rounded-xl border-2 py-2.5 text-center text-sm font-semibold transition-all"
                        style={{
                          borderColor: nuevoEstado === e ? (e === "activo" ? "var(--green)" : "var(--red)") : "var(--border)",
                          background:  nuevoEstado === e ? (e === "activo" ? "var(--green-bg)" : "var(--red-bg)") : "var(--background-card)",
                          color:       nuevoEstado === e ? (e === "activo" ? "var(--green)" : "var(--red)") : "var(--foreground)",
                        }}
                      >
                        {e === "activo" ? "Activo" : "Solo lectura"}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Advertencia de downgrade */}
            {nuevoPlan === "gratis" && planActual === "inicial" && (
              <div
                className="rounded-xl p-3 text-xs"
                style={{ background: "var(--orange-bg)", color: "var(--orange)" }}
              >
                ⚠️ Al pasar a plan Gratis, si el coach tiene más de 3 alumnos activos, los más antiguos serán archivados automáticamente (no eliminados).
              </div>
            )}

            {/* Motivo */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                Motivo del cambio <span className="font-normal">(opcional)</span>
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej: Pago recibido por transferencia, downgrade por falta de pago..."
                className="input-base min-h-[70px] resize-none"
                rows={2}
              />
            </div>

            {/* Acciones */}
            <div className="flex gap-3">
              <button
                onClick={() => setAbierto(false)}
                className="btn-secondary flex-1 justify-center"
                disabled={cargando}
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={cargando}
                className="btn-primary flex-1 justify-center disabled:opacity-60"
              >
                {cargando
                  ? <><Loader2 size={14} className="animate-spin" /> Guardando...</>
                  : "Guardar cambios"
                }
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
