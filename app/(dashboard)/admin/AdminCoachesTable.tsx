"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Avatar, Badge } from "@/components/ui"
import { PlanFeatureService } from "@/lib/plan-features"
import type { PlanActual, EstadoPlan } from "@prisma/client"

interface CoachRow {
  id: string
  plan_actual: PlanActual
  estado_plan: EstadoPlan
  fecha_vencimiento: Date | null
  user: { nombre: string; apellido: string; email: string; pais: string | null; activo: boolean }
  alumnos: { id: string }[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pagos: { fecha_pago: Date; monto: any }[]
}

interface Props {
  coaches: CoachRow[]
  busqueda: string
  filtro: string
}

const FILTROS = [
  { val: "todos",      label: "Todos" },
  { val: "inicial",    label: "Plan Inicial" },
  { val: "gratis",     label: "Plan Gratis" },
  { val: "por_vencer", label: "Por vencer" },
  { val: "vencidos",   label: "Vencidos" },
]

export function AdminCoachesTable({ coaches, busqueda, filtro }: Props) {
  const router = useRouter()
  const sp = useSearchParams()

  function navegar(clave: string, valor: string) {
    const params = new URLSearchParams(sp.toString())
    if (valor) params.set(clave, valor)
    else params.delete(clave)
    router.push(`/admin?${params.toString()}`)
  }

  function diasParaVencer(fecha: Date | null): number | null {
    if (!fecha) return null
    return Math.ceil((new Date(fecha).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000))
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
    >
      {/* Barra de búsqueda + filtros */}
      <div className="p-4 border-b space-y-3" style={{ borderColor: "var(--border)" }}>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-subtle)" }} />
          <input
            type="text"
            defaultValue={busqueda}
            placeholder="Buscar coach por nombre o email..."
            className="input-base pl-9 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") navegar("q", (e.target as HTMLInputElement).value)
            }}
            onChange={(e) => {
              if (e.target.value === "") navegar("q", "")
            }}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTROS.map(({ val, label }) => (
            <button
              key={val}
              onClick={() => navegar("filtro", val)}
              className="rounded-xl px-3 py-1.5 text-xs font-bold transition-all"
              style={{
                background: filtro === val ? "var(--blue)" : "var(--background)",
                color: filtro === val ? "white" : "var(--foreground-muted)",
                border: `1px solid ${filtro === val ? "var(--blue)" : "var(--border)"}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      {coaches.length === 0 ? (
        <p className="py-10 text-center text-sm" style={{ color: "var(--foreground-muted)" }}>No se encontraron coaches</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Coach", "Plan", "Alumnos", "Estado", "Vence", "Último pago", ""].map((h) => (
                  <th key={h} className="py-3 px-4 text-left text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
              {coaches.map((c) => {
                const dias = diasParaVencer(c.fecha_vencimiento)
                const limite = PlanFeatureService.limiteAlumnos(c.plan_actual)
                const pct = Math.min((c.alumnos.length / limite) * 100, 100)
                const urgente = dias !== null && dias <= 3
                const proximo = dias !== null && dias <= 7 && dias > 3

                return (
                  <tr key={c.id} className="hover:bg-[var(--background-hover)] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Avatar nombre={c.user.nombre} apellido={c.user.apellido} size="sm" />
                        <div>
                          <p className="font-semibold text-xs" style={{ color: "var(--foreground)" }}>
                            {c.user.nombre} {c.user.apellido}
                          </p>
                          <p className="text-[10px]" style={{ color: "var(--foreground-subtle)" }}>{c.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={c.plan_actual === "inicial" ? "plan-inicial" : "plan-gratis"}>
                        {PlanFeatureService.getNombrePlan(c.plan_actual)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-20">
                        <div className="flex justify-between text-[10px] mb-1" style={{ color: "var(--foreground-subtle)" }}>
                          <span>{c.alumnos.length}</span><span>{limite}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 100 ? "var(--red)" : "var(--blue)" }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={c.estado_plan === "activo" ? "success" : c.estado_plan === "solo_lectura" ? "danger" : "neutral"} dot>
                        {c.estado_plan === "activo" ? "Activo" : c.estado_plan === "solo_lectura" ? "Vencido" : "—"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {c.fecha_vencimiento ? (
                        <span
                          className="text-xs font-semibold"
                          style={{ color: urgente ? "var(--red)" : proximo ? "var(--orange)" : "var(--foreground-muted)" }}
                        >
                          {new Date(c.fecha_vencimiento).toLocaleDateString("es-EC", { day: "numeric", month: "short" })}
                          {urgente && " ⚠️"}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--foreground-subtle)" }}>—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {c.pagos[0] ? (
                        <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                          ${Number(c.pagos[0].monto).toFixed(0)} · {new Date(c.pagos[0].fecha_pago).toLocaleDateString("es-EC", { day: "numeric", month: "short" })}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--foreground-subtle)" }}>Sin pagos</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Link href={`/admin/coaches/${c.id}`} className="btn-secondary text-xs py-1.5 px-3">
                        Ver
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
