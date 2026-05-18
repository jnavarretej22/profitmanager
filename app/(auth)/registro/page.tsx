"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { z } from "zod"
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { Brand } from "@/components/ui"

const registroSchema = z.object({
  nombre: z.string().min(2, "Al menos 2 caracteres"),
  apellido: z.string().min(2, "Al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  confirmar: z.string(),
  terminos: z.boolean().refine((v) => v, "Debes aceptar los términos"),
}).refine((d) => d.password === d.confirmar, {
  message: "Las contraseñas no coinciden",
  path: ["confirmar"],
})

type FormErrors = Partial<Record<string, string>>

const PAISES = [
  { code: "EC", name: "Ecuador" },
  { code: "MX", name: "México" },
  { code: "CO", name: "Colombia" },
  { code: "AR", name: "Argentina" },
  { code: "PE", name: "Perú" },
  { code: "CL", name: "Chile" },
  { code: "VE", name: "Venezuela" },
  { code: "BO", name: "Bolivia" },
  { code: "UY", name: "Uruguay" },
  { code: "PY", name: "Paraguay" },
]

export default function RegistroPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    confirmar: "",
    pais: "EC",
    terminos: false,
  })
  const [mostrarPass, setMostrarPass] = useState(false)
  const [errores, setErrores] = useState<FormErrors>({})
  const [cargando, setCargando] = useState(false)
  const [exitoso, setExitoso] = useState(false)

  function setField(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }))
    if (errores[key]) setErrores((e) => ({ ...e, [key]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrores({})

    const parsed = registroSchema.safeParse(form)
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors
      const fFormErrors: FormErrors = {}
      Object.entries(fe).forEach(([k, v]) => { fFormErrors[k] = v?.[0] })
      setErrores(fFormErrors)
      return
    }

    setCargando(true)
    try {
      const res = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          apellido: form.apellido,
          email: form.email,
          password: form.password,
          pais: form.pais,
          terminos: true,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === "EMAIL_DUPLICADO") {
          setErrores({ email: "Este email ya está registrado" })
        } else {
          setErrores({ general: "Error al crear la cuenta. Intenta de nuevo." })
        }
        return
      }

      // Auto-login
      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      })

      setExitoso(true)
      setTimeout(() => router.push("/coach"), 1500)
    } catch {
      setErrores({ general: "Error de conexión. Intenta de nuevo." })
    } finally {
      setCargando(false)
    }
  }

  if (exitoso) {
    return (
      <div
        className="rounded-2xl p-10 text-center"
        style={{
          background: "var(--background-card)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <CheckCircle2 size={48} className="mx-auto mb-4" style={{ color: "var(--green)" }} />
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
          ¡Cuenta creada!
        </h2>
        <p style={{ color: "var(--foreground-muted)" }}>Redirigiendo a tu dashboard...</p>
      </div>
    )
  }

  return (
    <div>
      <div
        className="rounded-2xl p-8"
        style={{
          background: "var(--background-card)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div className="mb-6 text-center">
          <div className="flex justify-center mb-4">
            <Brand variant="icon" size="lg" href="/" />
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
          >
            Crea tu cuenta gratis
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--foreground-muted)" }}>
            Empieza a gestionar a tus alumnos hoy
          </p>
        </div>

        {errores.general && (
          <div
            className="mb-4 rounded-xl px-4 py-3 text-sm font-medium"
            style={{ background: "var(--red-bg)", color: "var(--red)" }}
          >
            {errores.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>
                Nombre
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setField("nombre", e.target.value)}
                placeholder="Ana"
                className="input-base"
                style={errores.nombre ? { borderColor: "var(--red)" } : undefined}
              />
              {errores.nombre && <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{errores.nombre}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>
                Apellido
              </label>
              <input
                type="text"
                value={form.apellido}
                onChange={(e) => setField("apellido", e.target.value)}
                placeholder="García"
                className="input-base"
                style={errores.apellido ? { borderColor: "var(--red)" } : undefined}
              />
              {errores.apellido && <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{errores.apellido}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>
              Correo electrónico
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="tu@email.com"
              className="input-base"
              style={errores.email ? { borderColor: "var(--red)" } : undefined}
            />
            {errores.email && <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{errores.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>
              Contraseña
            </label>
            <div className="relative">
              <input
                type={mostrarPass ? "text" : "password"}
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="input-base pr-10"
                style={errores.password ? { borderColor: "var(--red)" } : undefined}
              />
              <button
                type="button"
                onClick={() => setMostrarPass(!mostrarPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--foreground-subtle)" }}
                tabIndex={-1}
              >
                {mostrarPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errores.password && <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{errores.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>
              Confirmar contraseña
            </label>
            <input
              type={mostrarPass ? "text" : "password"}
              value={form.confirmar}
              onChange={(e) => setField("confirmar", e.target.value)}
              placeholder="Repite tu contraseña"
              className="input-base"
              style={errores.confirmar ? { borderColor: "var(--red)" } : undefined}
            />
            {errores.confirmar && <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{errores.confirmar}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>
              País
            </label>
            <select
              value={form.pais}
              onChange={(e) => setField("pais", e.target.value)}
              className="input-base"
            >
              {PAISES.map((p) => (
                <option key={p.code} value={p.code}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Términos */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.terminos}
              onChange={(e) => setField("terminos", e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded"
              style={{ accentColor: "var(--blue)" }}
            />
            <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>
              Acepto los{" "}
              <Link href="/terminos" className="font-semibold" style={{ color: "var(--blue)" }}>
                Términos y condiciones
              </Link>{" "}
              y la{" "}
              <Link href="/privacidad" className="font-semibold" style={{ color: "var(--blue)" }}>
                Política de privacidad
              </Link>
            </span>
          </label>
          {errores.terminos && <p className="text-xs" style={{ color: "var(--red)" }}>{errores.terminos}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="btn-primary w-full justify-center py-3 mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {cargando ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creando cuenta...
              </>
            ) : (
              "Crear cuenta gratis"
            )}
          </button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm" style={{ color: "var(--foreground-muted)" }}>
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold" style={{ color: "var(--blue)" }}>
          Iniciar sesión
        </Link>
      </p>
    </div>
  )
}
