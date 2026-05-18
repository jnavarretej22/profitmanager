"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, UserCheck, UserX, ShieldOff, Shield } from "lucide-react"

interface Props {
  coachId: string
  userActivo: boolean
  estadoPlan: string
}

export function AdminCoachAcciones({ coachId, userActivo, estadoPlan }: Props) {
  const [cargando, setCargando] = useState<string | null>(null)
  const router = useRouter()

  async function accion(tipo: string, payload: object) {
    setCargando(tipo)
    try {
      await fetch(`/api/admin/coaches/${coachId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      router.refresh()
    } finally {
      setCargando(null)
    }
  }

  return (
    <div className="flex flex-col gap-2 flex-shrink-0">
      {/* Activar/desactivar cuenta */}
      <button
        onClick={() => accion("toggle_user", { activo_user: !userActivo })}
        disabled={cargando !== null}
        className="btn-secondary text-xs flex items-center gap-1.5 disabled:opacity-60"
        style={{ color: userActivo ? "var(--red)" : "var(--green)", borderColor: userActivo ? "var(--red)44" : "var(--green)44" }}
      >
        {cargando === "toggle_user" ? <Loader2 size={13} className="animate-spin" /> : (userActivo ? <UserX size={13} /> : <UserCheck size={13} />)}
        {userActivo ? "Desactivar cuenta" : "Activar cuenta"}
      </button>

      {/* Activar/desactivar modo solo lectura */}
      {estadoPlan === "solo_lectura" ? (
        <button
          onClick={() => accion("activar_plan", { estado_plan: "activo" })}
          disabled={cargando !== null}
          className="btn-secondary text-xs flex items-center gap-1.5 disabled:opacity-60"
          style={{ color: "var(--green)", borderColor: "var(--green)44" }}
        >
          {cargando === "activar_plan" ? <Loader2 size={13} className="animate-spin" /> : <Shield size={13} />}
          Reactivar plan
        </button>
      ) : (
        <button
          onClick={() => accion("solo_lectura", { estado_plan: "solo_lectura" })}
          disabled={cargando !== null}
          className="btn-secondary text-xs flex items-center gap-1.5 disabled:opacity-60"
          style={{ color: "var(--orange)", borderColor: "var(--orange)44" }}
        >
          {cargando === "solo_lectura" ? <Loader2 size={13} className="animate-spin" /> : <ShieldOff size={13} />}
          Poner en solo lectura
        </button>
      )}
    </div>
  )
}
