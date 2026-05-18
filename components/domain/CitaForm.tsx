"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CalendarPlus, Video, MapPin, AlertCircle } from "lucide-react"
import { usePlan } from "@/lib/plan-context"

interface Alumno { id: string; user: { nombre: string; apellido: string } }

interface CitaFormProps {
  googleConectado: boolean
  alumnos: Alumno[]
  cita?: {
    id: string; titulo: string; alumno_id: string
    fecha_inicio: string; fecha_fin: string
    modalidad: string; ubicacion: string | null
    meet_link: string | null; notas: string | null
  }
}

export function CitaForm({ googleConectado, alumnos, cita }: CitaFormProps) {
  const router = useRouter()
  const { tieneFeature } = usePlan()
  const esPlanInicial = tieneFeature("meet_automatico")

  const [titulo, setTitulo] = useState(cita?.titulo ?? "")
  const [alumnoId, setAlumnoId] = useState(cita?.alumno_id ?? "")
  const [fechaInicio, setFechaInicio] = useState(
    cita ? cita.fecha_inicio.slice(0, 16) : ""
  )
  const [fechaFin, setFechaFin] = useState(
    cita ? cita.fecha_fin.slice(0, 16) : ""
  )
  const [modalidad, setModalidad] = useState<"online" | "presencial">(
    (cita?.modalidad as "online" | "presencial") ?? "online"
  )
  const [ubicacion, setUbicacion] = useState(cita?.ubicacion ?? "")
  const [meetLinkManual, setMeetLinkManual] = useState(cita?.meet_link ?? "")
  const [notas, setNotas] = useState(cita?.notas ?? "")
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!alumnoId) { setError("Selecciona un alumno"); return }
    if (!fechaInicio || !fechaFin) { setError("Las fechas son requeridas"); return }
    if (new Date(fechaFin) <= new Date(fechaInicio)) {
      setError("La fecha fin debe ser posterior a la fecha inicio"); return
    }

    setCargando(true)
    try {
      const url = cita ? `/api/citas/${cita.id}` : "/api/citas"
      const method = cita ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          alumno_id: alumnoId,
          fecha_inicio: new Date(fechaInicio).toISOString(),
          fecha_fin: new Date(fechaFin).toISOString(),
          modalidad,
          ubicacion: ubicacion || null,
          meet_link_manual: meetLinkManual || null,
          notas: notas || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Error al guardar la cita")
        return
      }
      router.push("/coach/agenda")
      router.refresh()
    } catch {
      setError("Error de conexión")
    } finally {
      setCargando(false)
    }
  }

  const labelClass = "block text-sm font-semibold mb-1.5"
  const labelStyle = { color: "var(--foreground)" }

  return (
    <form onSubmit={submit} className="space-y-5">

      {/* Título */}
      <div>
        <label className={labelClass} style={labelStyle}>Título de la cita *</label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ej: Sesión de seguimiento mensual"
          className="input-base"
          required
        />
      </div>

      {/* Alumno */}
      <div>
        <label className={labelClass} style={labelStyle}>Alumno *</label>
        <select value={alumnoId} onChange={(e) => setAlumnoId(e.target.value)} className="input-base" required>
          <option value="">Selecciona un alumno</option>
          {alumnos.map((a) => (
            <option key={a.id} value={a.id}>
              {a.user.nombre} {a.user.apellido}
            </option>
          ))}
        </select>
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} style={labelStyle}>Fecha y hora inicio *</label>
          <input
            type="datetime-local"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="input-base"
            required
          />
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Fecha y hora fin *</label>
          <input
            type="datetime-local"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="input-base"
            required
            min={fechaInicio}
          />
        </div>
      </div>

      {/* Modalidad */}
      <div>
        <label className={labelClass} style={labelStyle}>Modalidad</label>
        <div className="flex gap-3">
          {[
            { val: "online",     label: "Online",      icono: <Video size={15} /> },
            { val: "presencial", label: "Presencial",  icono: <MapPin size={15} /> },
          ].map(({ val, label, icono }) => (
            <button
              key={val}
              type="button"
              onClick={() => setModalidad(val as "online" | "presencial")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all border"
              style={{
                background: modalidad === val ? "var(--blue)" : "var(--background)",
                color: modalidad === val ? "white" : "var(--foreground-muted)",
                borderColor: modalidad === val ? "var(--blue)" : "var(--border)",
              }}
            >
              {icono} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Condicional: Meet o ubicación */}
      {modalidad === "online" ? (
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--background)", border: "1px solid var(--border)" }}
        >
          {esPlanInicial ? (
            googleConectado ? (
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: "var(--green)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--green)" }}>
                  Google Calendar conectado — se generará Meet automáticamente al guardar
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: "var(--orange)" }} />
                  <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                    Conecta Google Calendar para generar el link de Meet automáticamente.
                  </p>
                </div>
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a
                  href="/api/google/connect"
                  className="btn-secondary text-sm inline-flex"
                >
                  Conectar Google Calendar
                </a>
                <div>
                  <label className={labelClass} style={labelStyle}>O ingresa un link manual</label>
                  <input
                    type="url"
                    value={meetLinkManual}
                    onChange={(e) => setMeetLinkManual(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="input-base"
                  />
                </div>
              </div>
            )
          ) : (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--foreground-muted)" }}>
                🔒 Meet automático disponible en Plan Inicial
              </p>
              <label className={labelClass} style={labelStyle}>Link de reunión manual</label>
              <input
                type="url"
                value={meetLinkManual}
                onChange={(e) => setMeetLinkManual(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="input-base"
              />
            </div>
          )}
        </div>
      ) : (
        <div>
          <label className={labelClass} style={labelStyle}>Dirección / lugar de encuentro</label>
          <input
            type="text"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            placeholder="Ej: Gimnasio Centro, Av. Colón y 10 de Agosto"
            className="input-base"
          />
        </div>
      )}

      {/* Notas */}
      <div>
        <label className={labelClass} style={labelStyle}>Notas (opcional)</label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={3}
          placeholder="Temas a tratar, preparación previa, etc."
          className="input-base resize-none"
        />
      </div>

      {error && (
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3"
          style={{ background: "var(--red)15", border: "1px solid var(--red)33" }}
        >
          <AlertCircle size={16} style={{ color: "var(--red)" }} />
          <p className="text-sm" style={{ color: "var(--red)" }}>{error}</p>
        </div>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
        >
          Cancelar
        </button>
        <button type="submit" disabled={cargando} className="btn-primary disabled:opacity-60">
          {cargando ? <Loader2 size={15} className="animate-spin" /> : <CalendarPlus size={15} />}
          {cita ? "Guardar cambios" : "Agendar cita"}
        </button>
      </div>
    </form>
  )
}
