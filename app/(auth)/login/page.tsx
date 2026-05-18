"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"
import { Brand } from "@/components/ui"

const loginSchema = z.object({
  email: z.string().email("Ingresa un email válido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
})

type FormErrors = Partial<Record<"email" | "password" | "general", string>>

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mostrarPass, setMostrarPass] = useState(false)
  const [errores, setErrores] = useState<FormErrors>({})
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrores({})

    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors
      setErrores({
        email: fe.email?.[0],
        password: fe.password?.[0],
      })
      return
    }

    setCargando(true)
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })
    setCargando(false)

    if (result?.error) {
      setErrores({ general: "Email o contraseña incorrectos" })
      return
    }

    // Redirigir al proxy/middleware que llevará al usuario a su ruta correcta
    // según el rol. El proxy hace la verificación en servidor.
    router.push("/auth/redirect")
  }

  return (
    <div>
      {/* Card */}
      <div
        className="rounded-2xl p-8"
        style={{
          background: "var(--background-card)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div className="mb-7 text-center">
          <div className="flex justify-center mb-4">
            <Brand variant="icon" size="lg" href="/" />
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
          >
            Bienvenido de vuelta
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--foreground-muted)" }}>
            Ingresa con tu cuenta de ProFit Manager
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
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold mb-1.5"
              style={{ color: "var(--foreground)" }}
            >
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="input-base"
              style={errores.email ? { borderColor: "var(--red)" } : undefined}
            />
            {errores.email && (
              <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>
                {errores.email}
              </p>
            )}
          </div>

          {/* Contraseña */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="text-sm font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                Contraseña
              </label>
              <Link
                href="/recuperar-contrasena"
                className="text-xs font-medium"
                style={{ color: "var(--blue)" }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={mostrarPass ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
            {errores.password && (
              <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>
                {errores.password}
              </p>
            )}
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={cargando}
            className="btn-primary w-full justify-center py-3 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {cargando ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Ingresando...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </form>
      </div>

      {/* Registro */}
      <p className="mt-5 text-center text-sm" style={{ color: "var(--foreground-muted)" }}>
        ¿No tienes cuenta?{" "}
        <Link
          href="/registro"
          className="font-semibold"
          style={{ color: "var(--blue)" }}
        >
          Crear cuenta gratis
        </Link>
      </p>
    </div>
  )
}
