"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"

const alumnoSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres"),
  apellido: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  telefono: z.string().optional(),
  identificacion: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  genero: z.enum(["M", "F", "otro", ""]).optional(),
  altura_cm: z.string().optional(),
  peso_inicial_kg: z.string().optional(),
  objetivo: z.enum(["hipertrofia", "perdida_grasa", "fuerza", "resistencia", "general", ""]).optional(),
  fecha_inicio: z.string().optional(),
  notas_medicas: z.string().optional(),
})

type FormData = {
  nombre: string
  apellido: string
  email: string
  telefono: string
  identificacion: string
  fecha_nacimiento: string
  genero: string
  altura_cm: string
  peso_inicial_kg: string
  objetivo: string
  fecha_inicio: string
  notas_medicas: string
}

interface AlumnoFormProps {
  // Si se pasa alumnoId es edición, si no es creación
  alumnoId?: string
  valorInicial?: Partial<FormData>
  onExito?: (id: string) => void
}

const CAMPO_LABEL: Record<string, string> = {
  nombre: "Nombre",
  apellido: "Apellido",
  email: "Correo electrónico",
  telefono: "Teléfono",
  identificacion: "Cédula / DNI / Pasaporte",
  fecha_nacimiento: "Fecha de nacimiento",
  genero: "Género",
  altura_cm: "Altura (cm)",
  peso_inicial_kg: "Peso inicial (kg)",
  objetivo: "Objetivo principal",
  fecha_inicio: "Fecha de inicio del programa",
  notas_medicas: "Notas médicas",
}

interface CampoProps {
  campo: keyof FormData
  form: FormData
  errores: Record<string, string>
  setField: (key: keyof FormData, value: string) => void
  type?: string
  placeholder?: string
  children?: React.ReactNode
  requerido?: boolean
}

function Campo({ campo, form, errores, setField, type = "text", placeholder, children, requerido }: CampoProps) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>
        {CAMPO_LABEL[campo]}
        {requerido && <span style={{ color: "var(--red)" }}> *</span>}
      </label>
      {children ?? (
        <input
          type={type}
          value={form[campo]}
          onChange={(e) => setField(campo, e.target.value)}
          placeholder={placeholder}
          className="input-base"
          style={errores[campo] ? { borderColor: "var(--red)" } : undefined}
        />
      )}
      {errores[campo] && (
        <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>
          {errores[campo]}
        </p>
      )}
    </div>
  )
}

export function AlumnoForm({ alumnoId, valorInicial = {}, onExito }: AlumnoFormProps) {
  const router = useRouter()
  const esEdicion = !!alumnoId

  const [form, setForm] = useState<FormData>({
    nombre: valorInicial.nombre ?? "",
    apellido: valorInicial.apellido ?? "",
    email: valorInicial.email ?? "",
    telefono: valorInicial.telefono ?? "",
    identificacion: valorInicial.identificacion ?? "",
    fecha_nacimiento: valorInicial.fecha_nacimiento ?? "",
    genero: valorInicial.genero ?? "",
    altura_cm: valorInicial.altura_cm ?? "",
    peso_inicial_kg: valorInicial.peso_inicial_kg ?? "",
    objetivo: valorInicial.objetivo ?? "",
    fecha_inicio: valorInicial.fecha_inicio ?? new Date().toISOString().split("T")[0],
    notas_medicas: valorInicial.notas_medicas ?? "",
  })

  const [errores, setErrores] = useState<Record<string, string>>({})
  const [errorGeneral, setErrorGeneral] = useState("")
  const [cargando, setCargando] = useState(false)

  function setField(key: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    if (errores[key]) setErrores((e) => ({ ...e, [key]: "" }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrores({})
    setErrorGeneral("")

    const body: Record<string, string | number | undefined> = {
      nombre: form.nombre,
      apellido: form.apellido,
      email: form.email,
      telefono: form.telefono || undefined,
      identificacion: form.identificacion || undefined,
      fecha_nacimiento: form.fecha_nacimiento || undefined,
      genero: form.genero || undefined,
      altura_cm: form.altura_cm ? parseInt(form.altura_cm) : undefined,
      peso_inicial_kg: form.peso_inicial_kg ? parseFloat(form.peso_inicial_kg) : undefined,
      objetivo: form.objetivo || undefined,
      fecha_inicio: form.fecha_inicio || undefined,
      notas_medicas: form.notas_medicas || undefined,
    }

    setCargando(true)
    try {
      const url = esEdicion ? `/api/alumnos/${alumnoId}` : "/api/alumnos"
      const method = esEdicion ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === "EMAIL_DUPLICADO") {
          setErrores({ email: "Este email ya está registrado" })
        } else if (data.error === "PLAN_LIMIT_REACHED") {
          setErrorGeneral(data.mensaje)
        } else if (data.error === "READ_ONLY_MODE") {
          setErrorGeneral("Tu plan está vencido. No puedes crear ni editar datos.")
        } else {
          setErrorGeneral(data.mensaje ?? "Error al guardar. Intenta de nuevo.")
        }
        return
      }

      const id = esEdicion ? alumnoId : data.alumno.id

      if (onExito) {
        onExito(id)
      } else if (esEdicion) {
        router.push(`/coach/alumnos/${id}`)
      } else {
        // Toast con CTA para asignar rutina inmediatamente — reduce fricción en el flujo principal del coach
        toast.success("Alumno creado correctamente", {
          description: `${form.nombre} ${form.apellido} ya está en tu lista`,
          duration: 8000,
          action: {
            label: "Asignar rutina ahora →",
            onClick: () => router.push(`/coach/rutinas/nueva?alumno_id=${id}`),
          },
        })
        router.push(`/coach/alumnos/${id}`)
      }
    } catch {
      setErrorGeneral("Error de conexión. Intenta de nuevo.")
    } finally {
      setCargando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorGeneral && (
        <div
          className="rounded-xl px-4 py-3 text-sm font-medium"
          style={{ background: "var(--red-bg)", color: "var(--red)" }}
        >
          {errorGeneral}
        </div>
      )}

      {/* Información personal */}
      <fieldset
        className="rounded-2xl p-5 space-y-4"
        style={{
          background: "var(--background-card)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <legend className="text-sm font-bold px-1" style={{ color: "var(--foreground)" }}>
          Información personal
        </legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo campo="nombre" form={form} errores={errores} setField={setField} placeholder="Ana" requerido />
          <Campo campo="apellido" form={form} errores={errores} setField={setField} placeholder="García" requerido />
        </div>

        {!esEdicion && (
          <Campo campo="email" form={form} errores={errores} setField={setField} type="email" placeholder="alumno@email.com" requerido>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="alumno@email.com"
              className="input-base"
              style={errores.email ? { borderColor: "var(--red)" } : undefined}
            />
          </Campo>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo campo="telefono" form={form} errores={errores} setField={setField} placeholder="+593 99 999 9999" />
          <Campo campo="identificacion" form={form} errores={errores} setField={setField} placeholder="Cédula, DNI o pasaporte" />
        </div>
      </fieldset>

      {/* Datos físicos */}
      <fieldset
        className="rounded-2xl p-5 space-y-4"
        style={{
          background: "var(--background-card)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <legend className="text-sm font-bold px-1" style={{ color: "var(--foreground)" }}>
          Datos físicos
        </legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo campo="fecha_nacimiento" form={form} errores={errores} setField={setField} type="date" />
          <Campo campo="genero" form={form} errores={errores} setField={setField}>
            <select
              value={form.genero}
              onChange={(e) => setField("genero", e.target.value)}
              className="input-base"
            >
              <option value="">Seleccionar</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="otro">Otro / Prefiero no decir</option>
            </select>
          </Campo>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo campo="altura_cm" form={form} errores={errores} setField={setField} type="number" placeholder="170" />
          <Campo campo="peso_inicial_kg" form={form} errores={errores} setField={setField} type="number" placeholder="70.5" />
        </div>

        <Campo campo="objetivo" form={form} errores={errores} setField={setField}>
          <select
            value={form.objetivo}
            onChange={(e) => setField("objetivo", e.target.value)}
            className="input-base"
          >
            <option value="">Seleccionar objetivo</option>
            <option value="hipertrofia">Hipertrofia (ganar músculo)</option>
            <option value="perdida_grasa">Pérdida de grasa</option>
            <option value="fuerza">Fuerza</option>
            <option value="resistencia">Resistencia</option>
            <option value="general">General / Bienestar</option>
          </select>
        </Campo>
      </fieldset>

      {/* Programa */}
      <fieldset
        className="rounded-2xl p-5 space-y-4"
        style={{
          background: "var(--background-card)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <legend className="text-sm font-bold px-1" style={{ color: "var(--foreground)" }}>
          Programa
        </legend>

        <Campo campo="fecha_inicio" form={form} errores={errores} setField={setField} type="date" />

        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>
            {CAMPO_LABEL.notas_medicas}
          </label>
          <textarea
            value={form.notas_medicas}
            onChange={(e) => setField("notas_medicas", e.target.value)}
            placeholder="Lesiones, contraindicaciones, condiciones médicas relevantes..."
            rows={3}
            className="input-base resize-none"
          />
          <p className="mt-1 text-xs" style={{ color: "var(--foreground-subtle)" }}>
            Esta información es confidencial y solo visible para el coach.
          </p>
        </div>
      </fieldset>

      {/* Botones */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
          disabled={cargando}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={cargando}
          className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {cargando ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save size={16} />
              {esEdicion ? "Guardar cambios" : "Crear alumno"}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
