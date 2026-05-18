"use client"

import { useState } from "react"
import { Copy, Check, MessageCircle, Calendar, CreditCard } from "lucide-react"
import { toast } from "sonner"

interface Props {
  coachNombre: string
  coachEmail: string
  esRenovacion?: boolean
}

const DATOS_BANCARIOS = [
  { label: "Banco",   valor: "Banco Pichincha"         },
  { label: "Tipo",    valor: "Cuenta de Ahorros"       },
  { label: "N° Cuenta", valor: "2212345678"            },
  { label: "Titular", valor: "ProFit Manager S.A.S."   },
  { label: "RUC",     valor: "1792345678001"            },
]

function CopyField({ label, valor }: { label: string; valor: string }) {
  const [copiado, setCopiado] = useState(false)

  const copiar = () => {
    navigator.clipboard.writeText(valor)
    setCopiado(true)
    toast.success(`"${label}" copiado`)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-xl"
      style={{ background: "var(--gray-100)" }}
    >
      <div>
        <p className="text-xs font-medium" style={{ color: "var(--foreground-muted)" }}>{label}</p>
        <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{valor}</p>
      </div>
      <button
        onClick={copiar}
        className="p-1.5 rounded-lg transition-colors"
        style={{ color: copiado ? "var(--green)" : "var(--foreground-muted)", background: "var(--background-card)" }}
        title="Copiar"
      >
        {copiado ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  )
}

export function SolicitarUpgradeForm({ coachNombre, coachEmail, esRenovacion = false }: Props) {
  const [periodicidad, setPeriodicidad] = useState<"mensual" | "anual">("mensual")

  const monto = periodicidad === "anual" ? "$144 USD (anual)" : "$15 USD/mes"
  const mensajeWhatsApp = encodeURIComponent(
    `Hola! Soy ${coachNombre} (${coachEmail}). Quiero ${esRenovacion ? "renovar" : "contratar"} el Plan Inicial de ProFit Manager (${monto}). Adjunto comprobante de transferencia.`
  )

  return (
    <div
      className="rounded-2xl p-5 space-y-5"
      style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
    >
      <div>
        <h3 className="font-bold text-base" style={{ color: "var(--foreground)" }}>
          {esRenovacion ? "Renovar plan" : "Actualizar al Plan Inicial"}
        </h3>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
          El pago es por transferencia bancaria. Envía el comprobante por WhatsApp y activamos tu plan en menos de 24h.
        </p>
      </div>

      {/* Selector de periodicidad */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--foreground-muted)" }}>Periodicidad</p>
        <div className="grid grid-cols-2 gap-3">
          {(["mensual", "anual"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodicidad(p)}
              className="rounded-xl border-2 p-3 text-left transition-all"
              style={{
                borderColor:  periodicidad === p ? "var(--blue)"       : "var(--border)",
                background:   periodicidad === p ? "var(--blue-bg)"    : "var(--background-card)",
                color:        periodicidad === p ? "var(--blue)"       : "var(--foreground)",
              }}
            >
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                <span className="text-sm font-bold capitalize">{p}</span>
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
                {p === "mensual" ? "$15 USD / mes" : "$144 USD / año · "}
                {p === "anual" && <span style={{ color: "var(--green)" }}>ahorra $36</span>}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Datos bancarios */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CreditCard size={14} style={{ color: "var(--blue)" }} />
          <p className="text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>Datos bancarios</p>
        </div>
        <div className="space-y-2">
          {DATOS_BANCARIOS.map((d) => (
            <CopyField key={d.label} label={d.label} valor={d.valor} />
          ))}
          <CopyField label="Monto a transferir" valor={periodicidad === "anual" ? "144.00 USD" : "15.00 USD"} />
        </div>
      </div>

      {/* CTA WhatsApp */}
      <a
        href={`https://wa.me/593999999999?text=${mensajeWhatsApp}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
        style={{
          background: "#25D366",
          color: "#fff",
          boxShadow: "0 2px 8px rgba(37,211,102,0.3)",
        }}
      >
        <MessageCircle size={16} />
        Enviar comprobante por WhatsApp
      </a>

      <p className="text-xs text-center" style={{ color: "var(--foreground-subtle)" }}>
        También puedes enviar el comprobante a{" "}
        <a href="mailto:pagos@profitmanager.app" style={{ color: "var(--blue)" }}>
          pagos@profitmanager.app
        </a>
      </p>
    </div>
  )
}
