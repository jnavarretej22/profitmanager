"use client"

import { useState } from "react"
import { z } from "zod"
import { Loader2, CheckCircle2, Mail } from "lucide-react"
import Link from "next/link"
import { Brand } from "@/components/ui"

const emailSchema = z.object({
  email: z.string().email("Ingresa un email válido"),
})

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const parsed = emailSchema.safeParse({ email })
    if (!parsed.success) {
      setError("Ingresa un email válido")
      return
    }

    setCargando(true)
    try {
      await fetch("/api/auth/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      // Siempre mostrar éxito (no filtrar si el email existe)
      setEnviado(true)
    } finally {
      setCargando(false)
    }
  }

  if (enviado) {
    return (
      <div
        className="rounded-2xl p-10 text-center"
        style={{
          background: "var(--background-card)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "var(--green-bg)" }}
        >
          <CheckCircle2 size={28} style={{ color: "var(--green)" }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
          Revisa tu email
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--foreground-muted)" }}>
          Si tu email está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
        </p>
        <Link href="/login" className="btn-secondary">
          Volver al inicio de sesión
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
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div className="mb-6 text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "var(--blue-bg)" }}
          >
            <Mail size={24} style={{ color: "var(--blue)" }} />
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
          >
            Recuperar contraseña
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--foreground-muted)" }}>
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="input-base"
              style={error ? { borderColor: "var(--red)" } : undefined}
            />
            {error && <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{error}</p>}
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="btn-primary w-full justify-center py-3 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {cargando ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar enlace de recuperación"
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
