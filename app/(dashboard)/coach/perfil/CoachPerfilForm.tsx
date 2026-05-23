"use client"

import { useState } from "react"
import { Loader2, Save, Eye, EyeOff, Lock } from "lucide-react"
import { cerrarSesion } from "@/lib/cerrar-sesion"

const ZONAS_HORARIAS = [
  "America/Guayaquil","America/Bogota","America/Lima",
  "America/Mexico_City","America/Argentina/Buenos_Aires",
  "America/Santiago","America/Caracas","America/La_Paz",
]

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>{children}</label>
  )
}

function ReadOnly({ label, val }: { label: string; val: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="rounded-xl px-3 py-2.5 text-sm" style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
        {val}
      </div>
    </div>
  )
}

const PAISES = [
  { val: "EC", label: "Ecuador" }, { val: "MX", label: "México" },
  { val: "CO", label: "Colombia" }, { val: "AR", label: "Argentina" },
  { val: "PE", label: "Perú" }, { val: "CL", label: "Chile" },
  { val: "VE", label: "Venezuela" }, { val: "BO", label: "Bolivia" },
]

interface Props {
  nombre: string; apellido: string; email: string; telefono: string
  zona_horaria: string; pais: string; bio: string; especialidad: string
}

export function CoachPerfilForm(props: Props) {
  const [form, setForm] = useState({
    telefono: props.telefono, zona_horaria: props.zona_horaria,
    pais: props.pais, bio: props.bio, especialidad: props.especialidad,
  })
  const [cargando, setCargando] = useState(false)
  const [ok, setOk] = useState(false)
  const [error, setError] = useState("")

  const [pwdActual, setPwdActual] = useState("")
  const [pwdNueva, setPwdNueva] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [cargandoPwd, setCargandoPwd] = useState(false)
  const [okPwd, setOkPwd] = useState(false)
  const [errorPwd, setErrorPwd] = useState("")

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  async function guardarPerfil(e: React.FormEvent) {
    e.preventDefault(); setOk(false); setError("")
    setCargando(true)
    try {
      const res = await fetch("/api/coach/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) { setError("Error al guardar"); return }
      setOk(true)
    } catch { setError("Error de conexión") }
    finally { setCargando(false) }
  }

  async function cambiarPassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwdNueva.length < 6) { setErrorPwd("Mínimo 6 caracteres"); return }
    setOkPwd(false); setErrorPwd("")
    setCargandoPwd(true)
    try {
      const res = await fetch("/api/coach/cambiar-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password_actual: pwdActual, password_nueva: pwdNueva }),
      })
      const data = await res.json()
      if (!res.ok) { setErrorPwd(data.mensaje ?? "Error"); return }
      setOkPwd(true); setPwdActual(""); setPwdNueva("")
    } catch { setErrorPwd("Error de conexión") }
    finally { setCargandoPwd(false) }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={guardarPerfil}>
        <fieldset
          className="rounded-2xl p-5 space-y-4"
          style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <legend className="text-sm font-bold px-1" style={{ color: "var(--foreground)" }}>Información profesional</legend>

          <div className="grid grid-cols-2 gap-4">
            <ReadOnly label="Nombre" val={props.nombre} />
            <ReadOnly label="Apellido" val={props.apellido} />
          </div>
          <ReadOnly label="Correo electrónico" val={props.email} />

          <div>
            <Label>Especialidad</Label>
            <input type="text" value={form.especialidad} onChange={(e) => set("especialidad", e.target.value)} placeholder="Ej: Pérdida de grasa, Hipertrofia..." className="input-base" />
          </div>
          <div>
            <Label>Bio</Label>
            <textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} rows={3} placeholder="Cuéntales a tus alumnos sobre ti..." className="input-base resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Teléfono</Label>
              <input type="tel" value={form.telefono} onChange={(e) => set("telefono", e.target.value)} placeholder="+593 99 999 9999" className="input-base" />
            </div>
            <div>
              <Label>País</Label>
              <select value={form.pais} onChange={(e) => set("pais", e.target.value)} className="input-base">
                {PAISES.map((p) => <option key={p.val} value={p.val}>{p.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label>Zona horaria</Label>
            <select value={form.zona_horaria} onChange={(e) => set("zona_horaria", e.target.value)} className="input-base">
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

      {/* Cambio de contraseña */}
      <form onSubmit={cambiarPassword}>
        <fieldset
          className="rounded-2xl p-5 space-y-4"
          style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <legend className="text-sm font-bold px-1" style={{ color: "var(--foreground)" }}>Cambiar contraseña</legend>
          <div>
            <Label>Contraseña actual</Label>
            <div className="relative">
              <input type={showPwd ? "text" : "password"} value={pwdActual} onChange={(e) => setPwdActual(e.target.value)} className="input-base pr-10" required />
              <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-subtle)" }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <Label>Nueva contraseña</Label>
            <input type={showPwd ? "text" : "password"} value={pwdNueva} onChange={(e) => setPwdNueva(e.target.value)} placeholder="Mínimo 6 caracteres" className="input-base" required minLength={6} />
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

      {/* Logout */}
      <div className="rounded-2xl px-5 py-4 flex items-center justify-between" style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}>
        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Cerrar sesión</p>
        <button onClick={() => cerrarSesion()} className="btn-secondary text-sm" style={{ color: "var(--red)", borderColor: "var(--red)44" }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
