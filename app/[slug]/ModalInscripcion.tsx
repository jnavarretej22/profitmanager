"use client"

import Link from "next/link"
import { useState } from "react"
import { X, Loader2, CheckCircle2, UserPlus } from "lucide-react"

interface Props {
  slug:        string
  nombreCoach: string
  cuposDisponibles: number
}

type Paso = "form" | "enviando" | "exito" | "error"

export function ModalInscripcion({ slug, nombreCoach, cuposDisponibles }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [paso, setPaso]       = useState<Paso>("form")
  const [errorMsg, setErrorMsg] = useState("")

  const [form, setForm] = useState({
    nombre:   "",
    email:    "",
    telefono: "",
    mensaje:  "",
  })

  function abrir() {
    setPaso("form")
    setErrorMsg("")
    setForm({ nombre: "", email: "", telefono: "", mensaje: "" })
    setAbierto(true)
  }
  function cerrar() { setAbierto(false) }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim() || !form.email.trim()) return
    setPaso("enviando")

    try {
      const res = await fetch(`/api/public/coach/${slug}/solicitud`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          nombre:   form.nombre.trim(),
          email:    form.email.trim().toLowerCase(),
          telefono: form.telefono.trim() || null,
          mensaje:  form.mensaje.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.mensaje ?? "Ocurrió un error. Intenta de nuevo.")
        setPaso("error")
        return
      }
      setPaso("exito")
    } catch {
      setErrorMsg("Error de conexión. Verifica tu internet e intenta de nuevo.")
      setPaso("error")
    }
  }

  const sinCupos = cuposDisponibles <= 0

  return (
    <>
      {/* Botón de inscripción */}
      <button
        onClick={sinCupos ? undefined : abrir}
        disabled={sinCupos}
        className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl text-sm font-bold transition-all"
        style={{
          background:  sinCupos ? "#e5e7eb" : "white",
          color:       sinCupos ? "#9ca3af"  : "#111827",
          border:      sinCupos ? "none"      : "2px solid #e5e7eb",
          cursor:      sinCupos ? "not-allowed": "pointer",
          boxShadow:   sinCupos ? "none"      : "0 1px 4px rgba(0,0,0,0.06)",
        }}
        title={sinCupos ? "Este coach no tiene cupos disponibles actualmente" : undefined}
      >
        <UserPlus size={17} />
        {sinCupos ? "Sin cupos disponibles" : "Deseo inscribirme"}
      </button>

      {/* Modal */}
      {abierto && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) cerrar() }}
        >
          <div
            className="w-full max-w-md rounded-2xl flex flex-col my-auto"
            style={{ background: "white", maxHeight: "calc(100dvh - 24px)" }}
          >
            {/* Header fijo */}
            <div className="flex items-center justify-between p-5 pb-3 border-b flex-shrink-0" style={{ borderColor: "#f3f4f6" }}>
              <div>
                <p className="font-extrabold text-base" style={{ color: "#111827" }}>Solicitar inscripción</p>
                <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>Con {nombreCoach}</p>
              </div>
              <button
                onClick={cerrar}
                className="h-8 w-8 rounded-full flex items-center justify-center"
                style={{ background: "#f3f4f6" }}
              >
                <X size={16} style={{ color: "#374151" }} />
              </button>
            </div>

            {/* Contenido desplazable */}
            <div className="p-5 overflow-y-auto flex-1">

              {/* ── Formulario ── */}
              {(paso === "form" || paso === "enviando") && (
                <form onSubmit={enviar} className="space-y-4">
                  <p className="text-sm" style={{ color: "#4b5563" }}>
                    Completa tu información y el coach revisará tu solicitud. Si es aprobada, recibirás un correo con tus datos de acceso.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>
                      Nombre completo <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.nombre}
                      onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                      placeholder="Tu nombre y apellido"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none transition-all"
                      style={{
                        border:    "1.5px solid #e5e7eb",
                        color:     "#111827",
                        background:"white",
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = "#2D7DF6"}
                      onBlur={(e)  => e.currentTarget.style.borderColor = "#e5e7eb"}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>
                      Correo electrónico <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="tu@correo.com"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none transition-all"
                      style={{ border: "1.5px solid #e5e7eb", color: "#111827", background: "white" }}
                      onFocus={(e) => e.currentTarget.style.borderColor = "#2D7DF6"}
                      onBlur={(e)  => e.currentTarget.style.borderColor = "#e5e7eb"}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>
                      WhatsApp / Teléfono <span style={{ color: "#9ca3af", fontWeight: 400 }}>(opcional)</span>
                    </label>
                    <input
                      type="tel"
                      value={form.telefono}
                      onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                      placeholder="+593 987 654 321"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none transition-all"
                      style={{ border: "1.5px solid #e5e7eb", color: "#111827", background: "white" }}
                      onFocus={(e) => e.currentTarget.style.borderColor = "#2D7DF6"}
                      onBlur={(e)  => e.currentTarget.style.borderColor = "#e5e7eb"}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold" style={{ color: "#374151" }}>
                        ¿Por qué quieres entrenar? <span style={{ color: "#9ca3af", fontWeight: 400 }}>(opcional)</span>
                      </label>
                      <span className="text-xs" style={{ color: "#9ca3af" }}>{form.mensaje.length}/300</span>
                    </div>
                    <textarea
                      value={form.mensaje}
                      onChange={(e) => setForm((f) => ({ ...f, mensaje: e.target.value.slice(0, 300) }))}
                      placeholder="Ej: Quiero perder peso antes del verano y mejorar mi condición física..."
                      rows={3}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none transition-all resize-none"
                      style={{ border: "1.5px solid #e5e7eb", color: "#111827", background: "white" }}
                      onFocus={(e) => e.currentTarget.style.borderColor = "#2D7DF6"}
                      onBlur={(e)  => e.currentTarget.style.borderColor = "#e5e7eb"}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={paso === "enviando" || !form.nombre.trim() || !form.email.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: "#2D7DF6", color: "white" }}
                  >
                    {paso === "enviando"
                      ? <><Loader2 size={16} className="animate-spin" /> Enviando solicitud...</>
                      : "Enviar solicitud"
                    }
                  </button>

                  <p className="text-center text-[11px]" style={{ color: "#9ca3af" }}>
                    Plataforma gestionada por{" "}
                    <Link href="/" style={{ color: "#2D7DF6", fontWeight: 600 }}>ProFit Manager</Link>
                  </p>
                </form>
              )}

              {/* ── Éxito ── */}
              {paso === "exito" && (
                <div className="text-center py-6">
                  <div
                    className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: "#f0fdf4" }}
                  >
                    <CheckCircle2 size={32} style={{ color: "#22c55e" }} />
                  </div>
                  <h3 className="text-lg font-extrabold mb-2" style={{ color: "#111827" }}>¡Solicitud enviada!</h3>
                  <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: "#6b7280" }}>
                    Tu solicitud fue enviada. El coach <strong>{nombreCoach}</strong> revisará tu información y te contactará pronto. Revisa tu correo para la confirmación.
                  </p>
                  <button
                    onClick={cerrar}
                    className="px-6 py-2.5 rounded-xl font-bold text-sm"
                    style={{ background: "#f3f4f6", color: "#374151" }}
                  >
                    Cerrar
                  </button>
                </div>
              )}

              {/* ── Error ── */}
              {paso === "error" && (
                <div className="text-center py-6">
                  <div
                    className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: "#fef2f2" }}
                  >
                    <X size={28} style={{ color: "#ef4444" }} />
                  </div>
                  <h3 className="text-lg font-extrabold mb-2" style={{ color: "#111827" }}>No se pudo enviar</h3>
                  <p className="text-sm mb-6" style={{ color: "#6b7280" }}>{errorMsg}</p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setPaso("form")}
                      className="px-5 py-2.5 rounded-xl font-bold text-sm"
                      style={{ background: "#2D7DF6", color: "white" }}
                    >
                      Intentar de nuevo
                    </button>
                    <button
                      onClick={cerrar}
                      className="px-5 py-2.5 rounded-xl font-bold text-sm"
                      style={{ background: "#f3f4f6", color: "#374151" }}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
