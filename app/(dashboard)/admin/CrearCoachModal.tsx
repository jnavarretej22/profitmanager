"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { UserPlus, Loader2, X, CheckCircle2 } from "lucide-react"

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>{children}</label>
  )
}

export function CrearCoachModal() {
  const router = useRouter()
  const [abierto, setAbierto]   = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError]       = useState("")
  const [ok, setOk]             = useState(false)
  const [emailFallo, setEmailFallo] = useState(false)

  const [form, setForm] = useState({
    nombre:       "",
    apellido:     "",
    email:        "",
    telefono:     "",
    pais:         "EC",
    plan_actual:  "gratis" as "gratis" | "inicial",
    periodicidad: "mensual" as "mensual" | "anual",
  })

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  function reset() {
    setForm({
      nombre: "", apellido: "", email: "", telefono: "", pais: "EC",
      plan_actual: "gratis", periodicidad: "mensual",
    })
    setError("")
    setOk(false)
    setEmailFallo(false)
  }

  function cerrar() {
    setAbierto(false)
    setTimeout(reset, 200)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setCargando(true)
    try {
      const res = await fetch("/api/admin/coaches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre:       form.nombre.trim(),
          apellido:     form.apellido.trim(),
          email:        form.email.trim(),
          telefono:     form.telefono.trim() || null,
          pais:         form.pais || null,
          plan_actual:  form.plan_actual,
          periodicidad: form.plan_actual === "inicial" ? form.periodicidad : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.mensaje ?? data.error ?? "Error al crear coach")
        return
      }
      setOk(true)
      setEmailFallo(data.emailEnviado === false)
      router.refresh()
      setTimeout(cerrar, data.emailEnviado === false ? 5000 : 2200)
    } catch {
      setError("Error de conexión")
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <button onClick={() => setAbierto(true)} className="btn-secondary text-sm">
        <UserPlus size={15} /> Crear coach
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] rounded-2xl flex flex-col"
            style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-xl)" }}
          >
            <div
              className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <h2 className="text-lg font-bold" style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}>
                Crear coach
              </h2>
              <button
                onClick={cerrar}
                className="btn-ghost p-1.5"
                style={{ color: "var(--foreground-muted)" }}
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5 flex-1">
              {ok ? (
                <div className="py-8 text-center">
                  <CheckCircle2 size={36} className="mx-auto mb-3" style={{ color: "var(--green)" }} />
                  <p className="text-lg font-bold mb-1" style={{ color: "var(--foreground)" }}>¡Coach creado!</p>
                  {emailFallo ? (
                    <div
                      className="mx-auto mt-3 max-w-sm rounded-xl px-4 py-3 text-sm text-left"
                      style={{ background: "var(--orange-bg)", color: "var(--orange)" }}
                    >
                      <p className="font-semibold mb-1">El email de bienvenida no se pudo enviar.</p>
                      <p>Avísale al coach manualmente para que ingrese a <strong>/login</strong> con su email y cree su contraseña.</p>
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                      Le enviamos un email para que active su cuenta y cree su contraseña.
                    </p>
                  )}
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Nombre *</Label>
                      <input
                        type="text"
                        value={form.nombre}
                        onChange={(e) => set("nombre", e.target.value)}
                        className="input-base"
                        required
                        minLength={2}
                      />
                    </div>
                    <div>
                      <Label>Apellido *</Label>
                      <input
                        type="text"
                        value={form.apellido}
                        onChange={(e) => set("apellido", e.target.value)}
                        className="input-base"
                        required
                        minLength={2}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Email *</Label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="coach@email.com"
                      className="input-base"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Teléfono</Label>
                      <input
                        type="tel"
                        value={form.telefono}
                        onChange={(e) => set("telefono", e.target.value)}
                        placeholder="+593 99 999 9999"
                        className="input-base"
                      />
                    </div>
                    <div>
                      <Label>País</Label>
                      <select value={form.pais} onChange={(e) => set("pais", e.target.value)} className="input-base">
                        <option value="EC">Ecuador</option>
                        <option value="MX">México</option>
                        <option value="CO">Colombia</option>
                        <option value="AR">Argentina</option>
                        <option value="PE">Perú</option>
                        <option value="CL">Chile</option>
                        <option value="">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div
                    className="rounded-xl p-4 space-y-3"
                    style={{ background: "var(--background-hover)", border: "1px solid var(--border)" }}
                  >
                    <Label>Plan inicial</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => set("plan_actual", "gratis")}
                        className="rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
                        style={{
                          background:   form.plan_actual === "gratis" ? "var(--blue-bg)"  : "var(--background-card)",
                          color:        form.plan_actual === "gratis" ? "var(--blue)"     : "var(--foreground-muted)",
                          border:       `1px solid ${form.plan_actual === "gratis" ? "var(--blue)" : "var(--border)"}`,
                        }}
                      >
                        Gratis
                      </button>
                      <button
                        type="button"
                        onClick={() => set("plan_actual", "inicial")}
                        className="rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
                        style={{
                          background:   form.plan_actual === "inicial" ? "var(--blue-bg)" : "var(--background-card)",
                          color:        form.plan_actual === "inicial" ? "var(--blue)"    : "var(--foreground-muted)",
                          border:       `1px solid ${form.plan_actual === "inicial" ? "var(--blue)" : "var(--border)"}`,
                        }}
                      >
                        Inicial
                      </button>
                    </div>

                    {form.plan_actual === "inicial" && (
                      <div>
                        <Label>Periodicidad</Label>
                        <select
                          value={form.periodicidad}
                          onChange={(e) => set("periodicidad", e.target.value as "mensual" | "anual")}
                          className="input-base"
                        >
                          <option value="mensual">Mensual ($15) — vence en 1 mes</option>
                          <option value="anual">Anual ($144) — vence en 1 año</option>
                        </select>
                        <p className="mt-2 text-xs" style={{ color: "var(--foreground-subtle)" }}>
                          Se registrará automáticamente la fecha de vencimiento. El pago se registra aparte.
                        </p>
                      </div>
                    )}
                  </div>

                  <div
                    className="rounded-xl p-3 text-xs"
                    style={{ background: "var(--blue-bg)", color: "var(--blue-dark)" }}
                  >
                    El coach recibirá un email con un enlace para activar su cuenta y crear su propia contraseña.
                  </div>

                  {error && <p className="text-sm" style={{ color: "var(--red)" }}>{error}</p>}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button type="button" onClick={cerrar} className="btn-secondary" disabled={cargando}>
                      Cancelar
                    </button>
                    <button type="submit" disabled={cargando} className="btn-primary disabled:opacity-60">
                      {cargando ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Creando...
                        </>
                      ) : (
                        <>
                          <UserPlus size={16} />
                          Crear coach
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
