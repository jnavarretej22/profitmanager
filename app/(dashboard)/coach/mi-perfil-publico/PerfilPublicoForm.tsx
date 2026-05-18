"use client"

import Image from "next/image"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Loader2, Copy, Check, Globe,
  CheckCircle2, XCircle, Phone,
  ExternalLink, ToggleLeft, ToggleRight,
} from "lucide-react"
import { toast } from "sonner"

const ESPECIALIDADES = [
  "Hipertrofia", "Pérdida de grasa", "Fuerza",
  "Resistencia", "Nutrición deportiva", "Funcional",
]

interface FormState {
  slug:                  string
  perfil_publico_activo: boolean
  foto_publica_url:      string
  titulo_profesional:    string
  bio:                   string
  especialidades_tags:   string[]
  anios_experiencia:     number | null
  ciudad:                string
  instagram_url:         string
  cta_whatsapp_texto:    string
  telefono:              string
  nombre:                string
  apellido:              string
}

interface Props {
  inicial:  FormState
  baseUrl:  string
}

export function PerfilPublicoForm({ inicial, baseUrl }: Props) {
  const [form, setForm]               = useState<FormState>(inicial)
  const [cargando, setCargando]       = useState(false)
  const [copiado, setCopiado]         = useState(false)
  const [slugStatus, setSlugStatus]   = useState<"idle" | "checking" | "ok" | "error">("idle")
  const [slugError, setSlugError]     = useState("")
  const slugTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  const urlPublica = `${baseUrl}/${form.slug}`

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  // Verificar slug con debounce usando ref (evita stale closures)
  function verificarSlug(slug: string) {
    if (slugTimerRef.current) clearTimeout(slugTimerRef.current)
    setSlugStatus("checking")
    setSlugError("")
    slugTimerRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/coach/slug-disponible?slug=${encodeURIComponent(slug)}`)
        const data = await res.json()
        if (data.disponible) {
          setSlugStatus("ok")
        } else {
          setSlugStatus("error")
          setSlugError(data.error ?? "Esta URL ya está en uso")
        }
      } catch {
        setSlugStatus("error")
        setSlugError("Error al verificar disponibilidad")
      }
    }, 500)
  }

  function toggleEspecialidad(esp: string) {
    const actual = form.especialidades_tags
    if (actual.includes(esp)) {
      set("especialidades_tags", actual.filter((e) => e !== esp))
    } else if (actual.length < 4) {
      set("especialidades_tags", [...actual, esp])
    } else {
      toast.error("Máximo 4 especialidades")
    }
  }

  async function copiarLink() {
    await navigator.clipboard.writeText(urlPublica)
    setCopiado(true)
    toast.success("Enlace copiado al portapapeles")
    setTimeout(() => setCopiado(false), 2500)
  }

  async function guardar() {
    if (slugStatus === "error") {
      toast.error("Corrige el slug antes de guardar")
      return
    }
    setCargando(true)
    try {
      const res = await fetch("/api/coach/perfil-publico", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          slug:                  form.slug,
          perfil_publico_activo: form.perfil_publico_activo,
          foto_publica_url:      form.foto_publica_url || null,
          titulo_profesional:    form.titulo_profesional || null,
          bio:                   form.bio || null,
          especialidades_tags:   form.especialidades_tags,
          anios_experiencia:     form.anios_experiencia,
          ciudad:                form.ciudad || null,
          instagram_url:         form.instagram_url || null,
          cta_whatsapp_texto:    form.cta_whatsapp_texto || null,
          telefono:              form.telefono || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.mensaje ?? "Error al guardar")
        return
      }
      toast.success("Perfil guardado correctamente")
      router.refresh()
    } catch {
      toast.error("Error de conexión")
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="space-y-5">

      {/* ── Tarjeta estado + URL ──────────────────────────── */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Estado del perfil</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
              {form.perfil_publico_activo ? "Visible — cualquier persona puede ver tu perfil" : "Oculto — nadie puede ver tu perfil aún"}
            </p>
          </div>
          <button
            onClick={() => set("perfil_publico_activo", !form.perfil_publico_activo)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: form.perfil_publico_activo ? "var(--green-bg)" : "var(--gray-100)",
              color:      form.perfil_publico_activo ? "var(--green)"    : "var(--foreground-muted)",
            }}
          >
            {form.perfil_publico_activo
              ? <><ToggleRight size={18} /> Publicado</>
              : <><ToggleLeft  size={18} /> Oculto</>
            }
          </button>
        </div>

        {/* URL del perfil */}
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground-muted)" }}>
            Tu URL pública
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium select-none"
                style={{ color: "var(--foreground-muted)" }}
              >
                {baseUrl.replace(/https?:\/\//, "")}/
              </span>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => {
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                  set("slug", val)
                  if (val.length >= 3) verificarSlug(val)
                  else setSlugStatus("idle")
                }}
                className="input-base pl-[90px] pr-8"
                placeholder="tu-nombre"
                style={{ fontFamily: "monospace" }}
              />
              {/* Indicador de disponibilidad */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {slugStatus === "checking" && <Loader2 size={14} className="animate-spin" style={{ color: "var(--foreground-muted)" }} />}
                {slugStatus === "ok"       && <CheckCircle2 size={14} style={{ color: "var(--green)" }} />}
                {slugStatus === "error"    && <XCircle      size={14} style={{ color: "var(--red)"   }} />}
              </div>
            </div>
            <button
              onClick={copiarLink}
              className="btn-secondary px-3 flex-shrink-0"
              title="Copiar enlace"
            >
              {copiado ? <Check size={15} style={{ color: "var(--green)" }} /> : <Copy size={15} />}
            </button>
            <a
              href={urlPublica}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary px-3 flex-shrink-0"
              title="Ver perfil"
            >
              <ExternalLink size={15} />
            </a>
          </div>
          {slugStatus === "error" && (
            <p className="text-xs mt-1" style={{ color: "var(--red)" }}>{slugError}</p>
          )}
          {slugStatus === "ok" && (
            <p className="text-xs mt-1" style={{ color: "var(--green)" }}>¡URL disponible!</p>
          )}
        </div>
      </div>

      {/* ── Información personal ──────────────────────────── */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        <h2 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Información personal</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground-muted)" }}>Nombre</label>
            <input
              type="text"
              value={form.nombre}
              readOnly
              className="input-base opacity-60"
              style={{ cursor: "not-allowed" }}
            />
            <p className="text-[10px] mt-1" style={{ color: "var(--foreground-subtle)" }}>
              Editable en tu perfil de cuenta
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground-muted)" }}>Apellido</label>
            <input
              type="text"
              value={form.apellido}
              readOnly
              className="input-base opacity-60"
              style={{ cursor: "not-allowed" }}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground-muted)" }}>
            Título profesional
          </label>
          <input
            type="text"
            value={form.titulo_profesional}
            onChange={(e) => set("titulo_profesional", e.target.value)}
            placeholder='Ej: Entrenador Personal Certificado · Especialista en pérdida de grasa'
            className="input-base"
            maxLength={200}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>Sobre mí / Biografía</label>
            <span className="text-[10px]" style={{ color: "var(--foreground-subtle)" }}>{form.bio.length}/500</span>
          </div>
          <textarea
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
            placeholder="Cuéntales a tus futuros clientes quién eres, tu historia y por qué confiar en ti..."
            className="input-base min-h-[100px] resize-none"
            maxLength={500}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground-muted)" }}>
              Años de experiencia
            </label>
            <input
              type="number"
              min={0}
              max={60}
              value={form.anios_experiencia ?? ""}
              onChange={(e) => set("anios_experiencia", e.target.value ? Number(e.target.value) : null)}
              placeholder="Ej: 5"
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground-muted)" }}>
              Ciudad / País
            </label>
            <input
              type="text"
              value={form.ciudad}
              onChange={(e) => set("ciudad", e.target.value)}
              placeholder="Ej: Quito, Ecuador"
              className="input-base"
              maxLength={100}
            />
          </div>
        </div>
      </div>

      {/* ── Especialidades ────────────────────────────────── */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Especialidades</h2>
          <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>
            {form.especialidades_tags.length}/4 seleccionadas
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {ESPECIALIDADES.map((esp) => {
            const sel = form.especialidades_tags.includes(esp)
            return (
              <button
                key={esp}
                onClick={() => toggleEspecialidad(esp)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: sel ? "var(--blue)"    : "var(--gray-100)",
                  color:      sel ? "white"           : "var(--foreground-muted)",
                  border:     sel ? "none"            : "1px solid var(--border)",
                }}
              >
                {esp}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Contacto y redes ──────────────────────────────── */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        <h2 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Contacto y redes</h2>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground-muted)" }}>
            <Phone size={11} className="inline mr-1" />
            WhatsApp (con código de país)
          </label>
          <input
            type="tel"
            value={form.telefono}
            onChange={(e) => set("telefono", e.target.value)}
            placeholder="Ej: +593987654321"
            className="input-base"
            maxLength={30}
          />
          <p className="text-[10px] mt-1" style={{ color: "var(--foreground-subtle)" }}>
            Este número se usará para el botón de WhatsApp en tu perfil público
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground-muted)" }}>
            Instagram (handle o URL)
          </label>
          <input
            type="text"
            value={form.instagram_url}
            onChange={(e) => set("instagram_url", e.target.value)}
            placeholder="Ej: @micoach o https://instagram.com/micoach"
            className="input-base"
            maxLength={200}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground-muted)" }}>
            Texto del botón de contacto (WhatsApp)
          </label>
          <input
            type="text"
            value={form.cta_whatsapp_texto}
            onChange={(e) => set("cta_whatsapp_texto", e.target.value)}
            placeholder="Quiero una asesoría personalizada"
            className="input-base"
            maxLength={100}
          />
        </div>
      </div>

      {/* ── Vista previa rápida ────────────────────────────── */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        <h2 className="text-sm font-bold mb-3" style={{ color: "var(--foreground)" }}>
          Vista previa de tu perfil
        </h2>

        {/* Preview card */}
        <div
          className="rounded-xl p-5"
          style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)" }}
        >
          <div className="flex items-center gap-3 mb-3">
            {form.foto_publica_url ? (
              <Image
                src={form.foto_publica_url}
                alt="Foto de perfil"
                width={56}
                height={56}
                unoptimized
                className="h-14 w-14 rounded-full object-cover border-2 border-white/20"
              />
            ) : (
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center text-xl font-bold border-2 border-white/20"
                style={{ background: "linear-gradient(135deg, #2D7DF6, #F97316)" }}
              >
                <span className="text-white">
                  {form.nombre.charAt(0)}{form.apellido.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <p className="font-extrabold text-white">{form.nombre} {form.apellido}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                {form.titulo_profesional || "Título profesional"}
              </p>
              {form.ciudad && (
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>📍 {form.ciudad}</p>
              )}
            </div>
          </div>

          {form.especialidades_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {form.especialidades_tags.map((esp) => (
                <span
                  key={esp}
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: "rgba(45,125,246,0.3)", color: "#93c5fd" }}
                >
                  {esp}
                </span>
              ))}
            </div>
          )}

          {form.bio && (
            <p className="text-xs mb-3 line-clamp-2" style={{ color: "rgba(255,255,255,0.55)" }}>
              {form.bio}
            </p>
          )}

          <div
            className="w-full py-2.5 rounded-xl text-center text-sm font-bold"
            style={{ background: "#25D366", color: "white" }}
          >
            📱 {form.cta_whatsapp_texto || "Quiero una asesoría personalizada"}
          </div>
        </div>

        <p className="text-xs text-center mt-3" style={{ color: "var(--foreground-subtle)" }}>
          Esta es una vista simplificada. El perfil real tiene más detalles.{" "}
          {form.slug && (
            <a href={`/${form.slug}`} target="_blank" rel="noopener noreferrer" className="font-semibold" style={{ color: "var(--blue)" }}>
              Ver perfil completo →
            </a>
          )}
        </p>
      </div>

      {/* ── Foto de perfil pública ────────────────────────── */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        <h2 className="text-sm font-bold mb-3" style={{ color: "var(--foreground)" }}>Foto de perfil pública</h2>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground-muted)" }}>
            URL de tu foto (pega el enlace de tu foto)
          </label>
          <input
            type="url"
            value={form.foto_publica_url}
            onChange={(e) => set("foto_publica_url", e.target.value)}
            placeholder="https://..."
            className="input-base"
          />
          <p className="text-[10px] mt-1" style={{ color: "var(--foreground-subtle)" }}>
            Sube tu foto a Google Drive, Dropbox o similar y pega el enlace público aquí.
            Tamaño recomendado: 400×400px, formato cuadrado.
          </p>
        </div>
      </div>

      {/* ── Botón guardar ─────────────────────────────────── */}
      <button
        onClick={guardar}
        disabled={cargando || slugStatus === "error"}
        className="btn-primary w-full justify-center py-3 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {cargando
          ? <><Loader2 size={15} className="animate-spin" /> Guardando...</>
          : <><Globe size={15} /> Guardar y publicar perfil</>
        }
      </button>
    </div>
  )
}
