"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { z } from "zod"
import { Loader2, CheckCircle2, Lock, AlertTriangle } from "lucide-react"
import Link from "next/link"

const schema = z.object({
  password_nueva:    z.string().min(6, "Mínimo 6 caracteres"),
  password_confirma: z.string().min(1, "Confirma tu contraseña"),
}).refine((d) => d.password_nueva === d.password_confirma, {
  message: "Las contraseñas no coinciden",
  path:    ["password_confirma"],
})

function RestablecerForm() {
  const sp     = useSearchParams()
  const router = useRouter()
  const token  = sp.get("token") ?? ""

  const [form, setForm]         = useState({ password_nueva: "", password_confirma: "" })
  const [errores, setErrores]   = useState<Record<string, string>>({})
  const [errorGen, setErrorGen] = useState("")
  const [cargando, setCargando] = useState(false)
  const [exito, setExito]       = useState(false)

  useEffect(() => {
    if (!token) setErrorGen("Enlace inválido. Solicita uno nuevo desde la pantalla de recuperación.")
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrores({})
    setErrorGen("")

    const parsed = schema.safeParse(form)
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors
      setErrores({
        password_nueva:    flat.password_nueva?.[0] ?? "",
        password_confirma: flat.password_confirma?.[0] ?? "",
      })
      return
    }

    setCargando(true)
    try {
      const res  = await fetch("/api/auth/restablecer", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, password_nueva: form.password_nueva }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorGen(data.mensaje ?? "No se pudo restablecer la contraseña.")
        return
      }
      setExito(true)
      setTimeout(() => router.push("/login"), 3000)
    } catch {
      setErrorGen("Error de conexión. Intenta de nuevo.")
    } finally {
      setCargando(false)
    }
  }

  if (exito) {
    return (
      <div
        className="rounded-2xl p-10 text-center"
        style={{
          background:   "var(--background-card)",
          border:       "1px solid var(--border)",
          boxShadow:    "var(--shadow-lg)",
        }}
      >
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "var(--green-bg)" }}
        >
          <CheckCircle2 size={28} style={{ color: "var(--green)" }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
          Contraseña actualizada
        </h2>
        <p className="text-sm mb-1" style={{ color: "var(--foreground-muted)" }}>
          Ya puedes iniciar sesión con tu nueva contraseña.
        </p>
        <p className="text-xs mb-6" style={{ color: "var(--foreground-subtle)" }}>
          Redirigiendo en 3 segundos...
        </p>
        <Link href="/login" className="btn-primary">
          Ir al inicio de sesión
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div
        className="rounded-2xl p-8"
        style={{
          background: "var(--background-card)",
          border:     "1px solid var(--border)",
          boxShadow:  "var(--shadow-lg)",
        }}
      >
        <div className="mb-6 text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "var(--blue-bg)" }}
          >
            <Lock size={24} style={{ color: "var(--blue)" }} />
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
          >
            Nueva contraseña
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--foreground-muted)" }}>
            Elige una contraseña segura de mínimo 6 caracteres
          </p>
        </div>

        {errorGen && (
          <div
            className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm mb-4"
            style={{ background: "var(--red-bg)", color: "var(--red)" }}
          >
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            {errorGen}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>
              Nueva contraseña
            </label>
            <input
              type="password"
              value={form.password_nueva}
              onChange={(e) => setForm((f) => ({ ...f, password_nueva: e.target.value }))}
              placeholder="Mínimo 6 caracteres"
              className="input-base"
              disabled={!token}
              style={errores.password_nueva ? { borderColor: "var(--red)" } : undefined}
            />
            {errores.password_nueva && (
              <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{errores.password_nueva}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>
              Confirmar contraseña
            </label>
            <input
              type="password"
              value={form.password_confirma}
              onChange={(e) => setForm((f) => ({ ...f, password_confirma: e.target.value }))}
              placeholder="Repite la contraseña"
              className="input-base"
              disabled={!token}
              style={errores.password_confirma ? { borderColor: "var(--red)" } : undefined}
            />
            {errores.password_confirma && (
              <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{errores.password_confirma}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={cargando || !token}
            className="btn-primary w-full justify-center py-3 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {cargando ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar nueva contraseña"
            )}
          </button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm" style={{ color: "var(--foreground-muted)" }}>
        <Link href="/login" className="font-semibold" style={{ color: "var(--blue)" }}>
          ← Volver al inicio de sesión
        </Link>
      </p>
    </div>
  )
}

export default function RestablecerContrasenaPage() {
  return (
    <Suspense>
      <RestablecerForm />
    </Suspense>
  )
}
