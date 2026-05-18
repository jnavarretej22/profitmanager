"use client"

import { useState } from "react"
import { Loader2, Save, Eye, EyeOff, Lock, Info, AlertCircle } from "lucide-react"
import { signOut } from "next-auth/react"
import type { Objetivo, Genero } from "@prisma/client"

const OBJETIVO_LABEL: Record<Objetivo, string> = {
  hipertrofia: "Hipertrofia", perdida_grasa: "Pérdida de grasa",
  fuerza: "Fuerza", resistencia: "Resistencia", general: "General",
}

function SoloLectura({ label, valor }: { label: string; valor: string | null }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1" style={{ color: "var(--foreground-muted)" }}>{label}</label>
      <div
        className="rounded-xl px-3 py-2.5 text-sm"
        style={{ background: "var(--background)", border: "1px solid var(--border)", color: valor ? "var(--foreground)" : "var(--foreground-subtle)" }}
      >
        {valor ?? "—"}
      </div>
    </div>
  )
}

const ZONAS_HORARIAS = [
  "America/Guayaquil", "America/Bogota", "America/Lima",
  "America/Mexico_City", "America/Argentina/Buenos_Aires",
  "America/Santiago", "America/Caracas", "America/La_Paz",
]

interface PerfilAlumnoFormProps {
  nombre: string; apellido: string; email: string
  telefono: string; zona_horaria: string
  altura_cm: number | null; peso_inicial_kg: number | null
  objetivo: Objetivo | null; notas_medicas: string | null
  genero: Genero | null; fecha_nacimiento: string | null
}

export function PerfilAlumnoForm(props: PerfilAlumnoFormProps) {
  const [telefono, setTelefono] = useState(props.telefono)
  const [zonaHoraria, setZonaHoraria] = useState(props.zona_horaria)
  const [cargando, setCargando] = useState(false)
  const [ok, setOk] = useState(false)
  const [error, setError] = useState("")

  // Cambio de contraseña
  const [passwordActual, setPasswordActual] = useState("")
  const [passwordNueva, setPasswordNueva] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [cargandoPwd, setCargandoPwd] = useState(false)
  const [okPwd, setOkPwd] = useState(false)
  const [errorPwd, setErrorPwd] = useState("")

  async function guardarPerfil(e: React.FormEvent) {
    e.preventDefault()
    setOk(false); setError("")
    setCargando(true)
    try {
      const res = await fetch("/api/alumno/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefono, zona_horaria: zonaHoraria }),
      })
      if (!res.ok) { setError("Error al guardar"); return }
      setOk(true)
    } catch {
      setError("Error de conexión")
    } finally {
      setCargando(false)
    }
  }

  async function cambiarPassword(e: React.FormEvent) {
    e.preventDefault()
    if (passwordNueva.length < 6) { setErrorPwd("Mínimo 6 caracteres"); return }
    setOkPwd(false); setErrorPwd("")
    setCargandoPwd(true)
    try {
      const res = await fetch("/api/alumno/cambiar-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password_actual: passwordActual, password_nueva: passwordNueva }),
      })
      const data = await res.json()
      if (!res.ok) { setErrorPwd(data.mensaje ?? "Error al cambiar contraseña"); return }
      setOkPwd(true)
      setPasswordActual(""); setPasswordNueva("")
    } catch {
      setErrorPwd("Error de conexión")
    } finally {
      setCargandoPwd(false)
    }
  }


  return (
    <div className="space-y-5">

      {/* Datos editables */}
      <form onSubmit={guardarPerfil}>
        <fieldset
          className="rounded-2xl p-5 space-y-4"
          style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <legend className="text-sm font-bold px-1" style={{ color: "var(--foreground)" }}>Información de contacto</legend>

          <SoloLectura label="Nombre completo" valor={`${props.nombre} ${props.apellido}`} />
          <SoloLectura label="Correo electrónico" valor={props.email} />

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Teléfono</label>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+593 99 999 9999"
              className="input-base"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Zona horaria</label>
            <select value={zonaHoraria} onChange={(e) => setZonaHoraria(e.target.value)} className="input-base">
              {ZONAS_HORARIAS.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          {ok && <p className="text-sm font-medium" style={{ color: "var(--green)" }}>✓ Cambios guardados</p>}
          {error && <p className="text-sm" style={{ color: "var(--red)" }}>{error}</p>}

          <div className="flex justify-end">
            <button type="submit" disabled={cargando} className="btn-primary disabled:opacity-60">
              {cargando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Guardar cambios
            </button>
          </div>
        </fieldset>
      </form>

      {/* Datos físicos (solo lectura) */}
      <fieldset
        className="rounded-2xl p-5 space-y-4"
        style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="flex items-center gap-2">
          <legend className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Datos físicos</legend>
          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--foreground-subtle)" }}>
            <Info size={12} /> Solo tu coach puede modificar estos datos
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SoloLectura label="Altura" valor={props.altura_cm ? `${props.altura_cm} cm` : null} />
          <SoloLectura label="Peso inicial" valor={props.peso_inicial_kg ? `${props.peso_inicial_kg} kg` : null} />
          <SoloLectura label="Objetivo" valor={props.objetivo ? OBJETIVO_LABEL[props.objetivo] : null} />
          {props.notas_medicas && (
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--foreground-muted)" }}>
                Notas médicas
              </label>
              <div
                className="rounded-xl px-3 py-2.5 text-sm flex gap-2"
                style={{ background: "var(--orange-bg)", border: "1px solid var(--orange)", color: "var(--foreground)" }}
              >
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: "var(--orange)" }} />
                <span>{props.notas_medicas}</span>
              </div>
            </div>
          )}
          <SoloLectura label="Fecha de nacimiento" valor={props.fecha_nacimiento} />
        </div>
      </fieldset>

      {/* Cambio de contraseña */}
      <form onSubmit={cambiarPassword}>
        <fieldset
          className="rounded-2xl p-5 space-y-4"
          style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <legend className="text-sm font-bold px-1" style={{ color: "var(--foreground)" }}>Cambiar contraseña</legend>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Contraseña actual</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                className="input-base pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--foreground-subtle)" }}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Nueva contraseña</label>
            <input
              type={showPwd ? "text" : "password"}
              value={passwordNueva}
              onChange={(e) => setPasswordNueva(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="input-base"
              required
              minLength={6}
            />
          </div>

          {okPwd && <p className="text-sm font-medium" style={{ color: "var(--green)" }}>✓ Contraseña actualizada</p>}
          {errorPwd && <p className="text-sm" style={{ color: "var(--red)" }}>{errorPwd}</p>}

          <div className="flex justify-end">
            <button type="submit" disabled={cargandoPwd} className="btn-secondary disabled:opacity-60">
              {cargandoPwd ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
              Cambiar contraseña
            </button>
          </div>
        </fieldset>
      </form>

      {/* Cerrar sesión */}
      <div
        className="rounded-2xl px-5 py-4 flex items-center justify-between"
        style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}
      >
        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Cerrar sesión</p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="btn-secondary text-sm"
          style={{ color: "var(--red)", borderColor: "var(--red)44" }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
