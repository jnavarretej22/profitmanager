"use client"

import { useEffect, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { Eye, EyeOff, Loader2, Check, AlertCircle, Sparkles } from "lucide-react"
import Link from "next/link"
import { Brand } from "@/components/ui"

const emailSchema = z.string().email()

type EstadoEmail =
  | "vacio"            // sin email aún
  | "consultando"      // esperando respuesta del backend
  | "no_existe"        // email no registrado
  | "necesita_setup"   // existe pero sin password — primer acceso
  | "tiene_password"   // existe y tiene password — login normal

type FormErrors = Partial<Record<"email" | "password" | "confirm" | "general", string>>

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [mostrarPass, setMostrarPass] = useState(false)
  const [errores, setErrores] = useState<FormErrors>({})
  const [cargando, setCargando] = useState(false)
  const [estado, setEstado] = useState<EstadoEmail>("vacio")

  // Detecta el estado del email (debounce 500ms) para mostrar el form correspondiente.
  useEffect(() => {
    setErrores((e) => ({ ...e, email: undefined, general: undefined }))

    const trimmed = email.trim()
    if (!trimmed) {
      setEstado("vacio")
      return
    }
    const parsed = emailSchema.safeParse(trimmed)
    if (!parsed.success) {
      setEstado("vacio")
      return
    }

    setEstado("consultando")
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(trimmed)}`)
        const data = await res.json()
        if (!data.existe) {
          setEstado("no_existe")
        } else if (data.requiereSetup) {
          setEstado("necesita_setup")
        } else {
          setEstado("tiene_password")
        }
      } catch {
        // Si falla la consulta, asumir flujo normal para no bloquear el login
        setEstado("tiene_password")
      }
    }, 500)
    return () => clearTimeout(t)
  }, [email])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrores({})

    const emailParsed = emailSchema.safeParse(email.trim())
    if (!emailParsed.success) {
      setErrores({ email: "Ingresa un email válido" })
      return
    }
    if (!password) {
      setErrores({ password: "Ingresa tu contraseña" })
      return
    }

    // Flujo de primer acceso: setear contraseña, luego loguear
    if (estado === "necesita_setup") {
      if (password.length < 8) {
        setErrores({ password: "Mínimo 8 caracteres" })
        return
      }
      if (password !== confirm) {
        setErrores({ confirm: "Las contraseñas no coinciden" })
        return
      }

      setCargando(true)
      try {
        const res = await fetch("/api/auth/setup-password", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ email: email.trim().toLowerCase(), password }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setErrores({ general: data.mensaje ?? "No se pudo configurar la cuenta." })
          setCargando(false)
          return
        }
      } catch {
        setErrores({ general: "Error de conexión. Intenta de nuevo." })
        setCargando(false)
        return
      }
      // Cae al signIn de abajo (mismo path que el login normal)
    } else if (estado === "no_existe") {
      setErrores({ general: "No encontramos una cuenta con ese email." })
      return
    } else {
      setCargando(true)
    }

    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    })
    setCargando(false)

    if (result?.error) {
      setErrores({ general: "Email o contraseña incorrectos" })
      return
    }

    router.push("/auth/redirect")
  }

  const enSetup = estado === "necesita_setup"
  const submitLabel = enSetup ? "Activar cuenta y entrar" : "Iniciar sesión"
  const titulo = enSetup ? "Activa tu cuenta" : "Bienvenido de vuelta"
  const subtitulo = enSetup
    ? "Tu coach ya creó tu cuenta. Crea tu contraseña para entrar."
    : "Ingresa con tu cuenta de ProFit Manager"

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
        <div className="mb-7 text-center">
          <div className="flex justify-center mb-4">
            <Brand variant="icon" size="lg" href="/" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}>
            {titulo}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--foreground-muted)" }}>
            {subtitulo}
          </p>
        </div>

        {errores.general && (
          <div className="mb-4 rounded-xl px-4 py-3 text-sm font-medium" style={{ background: "var(--red-bg)", color: "var(--red)" }}>
            {errores.general}
          </div>
        )}

        {enSetup && (
          <div
            className="mb-4 rounded-xl px-4 py-3 flex items-start gap-2 text-sm"
            style={{ background: "var(--blue-bg)", color: "var(--blue)" }}
          >
            <Sparkles size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <p>Es tu primera vez. La contraseña que crees aquí será la tuya — solo tú la sabrás.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>
              Correo electrónico
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="input-base pr-9"
                style={errores.email || estado === "no_existe" ? { borderColor: "var(--red)" } : undefined}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                {estado === "consultando" && <Loader2 size={14} className="animate-spin" style={{ color: "var(--foreground-subtle)" }} />}
                {estado === "tiene_password" && <Check size={14} style={{ color: "var(--green)" }} />}
                {estado === "necesita_setup" && <Sparkles size={14} style={{ color: "var(--blue)" }} />}
                {estado === "no_existe" && <AlertCircle size={14} style={{ color: "var(--red)" }} />}
              </span>
            </div>
            {errores.email && (
              <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{errores.email}</p>
            )}
            {estado === "no_existe" && (
              <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>
                No encontramos una cuenta con ese email. Verifica con tu coach.
              </p>
            )}
          </div>

          {/* Contraseña */}
          {(estado === "tiene_password" || estado === "necesita_setup") && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  {enSetup ? "Crea tu contraseña" : "Contraseña"}
                </label>
                {!enSetup && (
                  <Link href="/recuperar-contrasena" className="text-xs font-medium" style={{ color: "var(--blue)" }}>
                    ¿Olvidaste tu contraseña?
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={mostrarPass ? "text" : "password"}
                  autoComplete={enSetup ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={enSetup ? "Mínimo 8 caracteres" : "••••••••"}
                  className="input-base pr-10"
                  style={errores.password ? { borderColor: "var(--red)" } : undefined}
                />
                <button
                  type="button"
                  onClick={() => setMostrarPass(!mostrarPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--foreground-subtle)" }}
                  tabIndex={-1}
                  aria-label={mostrarPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {mostrarPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errores.password && (
                <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{errores.password}</p>
              )}
            </div>
          )}

          {/* Confirmar contraseña (solo setup) */}
          {enSetup && (
            <div>
              <label htmlFor="confirm" className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>
                Confirma tu contraseña
              </label>
              <input
                id="confirm"
                type={mostrarPass ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repite la contraseña"
                className="input-base"
                style={errores.confirm ? { borderColor: "var(--red)" } : undefined}
              />
              {errores.confirm && (
                <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{errores.confirm}</p>
              )}
            </div>
          )}

          {/* Botón */}
          <button
            type="submit"
            disabled={cargando || estado === "consultando" || estado === "no_existe" || estado === "vacio"}
            className="btn-primary w-full justify-center py-3 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {cargando ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {enSetup ? "Activando..." : "Ingresando..."}
              </>
            ) : (
              submitLabel
            )}
          </button>
        </form>
      </div>

      {/* Registro */}
      <p className="mt-5 text-center text-sm" style={{ color: "var(--foreground-muted)" }}>
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-semibold" style={{ color: "var(--blue)" }}>
          Crear cuenta gratis
        </Link>
      </p>
    </div>
  )
}
