import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/db"
import { SLUGS_RESERVADOS } from "@/lib/slug"
import { LIMITES_ALUMNOS } from "@/lib/plan-features"
import type { Metadata } from "next"
import {
  MapPin, Star, Users, Calendar,
  Dumbbell, Flame, Zap, Wind, Apple, Activity,
} from "lucide-react"
import { ModalInscripcion } from "./ModalInscripcion"

// ── Metadatos SEO dinámicos ─────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const coach = await obtenerCoach(slug)
  if (!coach) return { title: "Perfil no encontrado" }

  const nombre = `${coach.user.nombre} ${coach.user.apellido}`
  return {
    title:       `${nombre} — Coach Fitness`,
    description: coach.bio ?? `Perfil profesional de ${nombre}, entrenador personal.`,
    openGraph: {
      title:       nombre,
      description: coach.bio ?? `Entrenador personal · ${coach.titulo_profesional ?? ""}`,
      images:      coach.foto_publica_url ? [{ url: coach.foto_publica_url }] : [],
      type:        "profile",
    },
  }
}

// ── Fetch de datos ──────────────────────────────────────────────────────────
async function obtenerCoach(slug: string) {
  if (SLUGS_RESERVADOS.has(slug)) return null

  const coach = await prisma.coach.findUnique({
    where: { slug },
    select: {
      perfil_publico_activo: true,
      plan_actual:           true,
      foto_publica_url:      true,
      titulo_profesional:    true,
      bio:                   true,
      especialidades_tags:   true,
      anios_experiencia:     true,
      ciudad:                true,
      instagram_url:         true,
      cta_whatsapp_texto:    true,
      user: { select: { nombre: true, apellido: true, telefono: true, pais: true } },
      _count: { select: { alumnos: { where: { activo: true, deleted_at: null } } } },
    },
  })

  if (!coach || !coach.perfil_publico_activo || coach.plan_actual !== "inicial") return null
  return coach
}

// ── Íconos por especialidad ─────────────────────────────────────────────────
const ESP_ICONO: Record<string, React.ElementType> = {
  "Hipertrofia":        Dumbbell,
  "Pérdida de grasa":   Flame,
  "Fuerza":             Zap,
  "Resistencia":        Wind,
  "Nutrición deportiva":Apple,
  "Funcional":          Activity,
}

const ESP_COLOR: Record<string, { bg: string; color: string }> = {
  "Hipertrofia":        { bg: "#eff6ff", color: "#2563eb" },
  "Pérdida de grasa":   { bg: "#fff7ed", color: "#ea580c" },
  "Fuerza":             { bg: "#faf5ff", color: "#7c3aed" },
  "Resistencia":        { bg: "#f0fdf4", color: "#16a34a" },
  "Nutrición deportiva":{ bg: "#ecfdf5", color: "#059669" },
  "Funcional":          { bg: "#fffbeb", color: "#d97706" },
}

// ── Componente página pública ───────────────────────────────────────────────
export default async function PerfilPublicoPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const coach = await obtenerCoach(slug)
  if (!coach) notFound()

  const nombre        = `${coach.user.nombre} ${coach.user.apellido}`
  const especialidades = (coach.especialidades_tags as string[]) ?? []
  const telefono      = coach.user.telefono?.replace(/\D/g, "") ?? ""
  const ctaTexto      = coach.cta_whatsapp_texto ?? "Quiero una asesoría personalizada"
  const waLink        = telefono
    ? `https://wa.me/${telefono}?text=${encodeURIComponent(`Hola ${coach.user.nombre}, vi tu perfil en ProFit Manager y me interesa una asesoría personalizada.`)}`
    : null

  const instagram = coach.instagram_url
    ? (coach.instagram_url.startsWith("http") ? coach.instagram_url : `https://instagram.com/${coach.instagram_url.replace("@", "")}`)
    : null

  const limite    = LIMITES_ALUMNOS[coach.plan_actual]
  const cuposDisponibles = Math.max(0, limite - coach._count.alumnos)

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>

      {/* ── Hero ──────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%)" }}>
        <div className="max-w-2xl mx-auto px-5 pt-12 pb-10">

          {/* Foto + nombre */}
          <div className="flex flex-col items-center text-center">
            {coach.foto_publica_url ? (
              <Image
                src={coach.foto_publica_url}
                alt={nombre}
                width={112}
                height={112}
                unoptimized
                className="h-28 w-28 rounded-full object-cover mb-4"
                style={{ border: "3px solid rgba(255,255,255,0.2)", boxShadow: "0 0 0 6px rgba(45,125,246,0.2)" }}
              />
            ) : (
              <div
                className="h-28 w-28 rounded-full flex items-center justify-center text-4xl font-extrabold mb-4"
                style={{
                  background:  "linear-gradient(135deg, #2D7DF6, #F97316)",
                  border:      "3px solid rgba(255,255,255,0.15)",
                  boxShadow:   "0 0 0 6px rgba(45,125,246,0.2)",
                  color:       "white",
                }}
              >
                {coach.user.nombre.charAt(0)}{coach.user.apellido.charAt(0)}
              </div>
            )}

            <h1
              className="text-2xl sm:text-3xl font-extrabold text-white mb-1"
              style={{ letterSpacing: "-0.02em" }}
            >
              {nombre}
            </h1>

            {coach.titulo_profesional && (
              <p className="text-sm sm:text-base mb-3" style={{ color: "rgba(255,255,255,0.65)" }}>
                {coach.titulo_profesional}
              </p>
            )}

            {/* Ubicación */}
            {(coach.ciudad || coach.user.pais) && (
              <div className="flex items-center gap-1.5 mb-4">
                <MapPin size={13} style={{ color: "rgba(255,255,255,0.4)" }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {[coach.ciudad, coach.user.pais].filter(Boolean).join(", ")}
                </span>
              </div>
            )}

            {/* Badges de especialidades */}
            {especialidades.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-5">
                {especialidades.map((esp) => (
                  <span
                    key={esp}
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: "rgba(45,125,246,0.25)", color: "#93c5fd" }}
                  >
                    {esp}
                  </span>
                ))}
              </div>
            )}

            {/* Stats compactos */}
            <div className="flex items-center gap-5 flex-wrap justify-center">
              {coach.anios_experiencia !== null && (
                <div className="text-center">
                  <p className="text-xl font-extrabold text-white">{coach.anios_experiencia}</p>
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>años exp.</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-xl font-extrabold text-white">{coach._count.alumnos}+</p>
                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>alumnos</p>
              </div>
              {especialidades.length > 0 && (
                <div className="text-center">
                  <p className="text-xl font-extrabold text-white">{especialidades.length}</p>
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>especialidades</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Contenido ─────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-5 py-8 space-y-6">

        {/* Sobre mí */}
        {coach.bio && (
          <div
            className="rounded-2xl p-5"
            style={{ background: "white", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
          >
            <h2 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: "#111827" }}>
              <span className="text-lg">👋</span> Sobre mí
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#4b5563" }}>{coach.bio}</p>
          </div>
        )}

        {/* Especialidades en cards */}
        {especialidades.length > 0 && (
          <div
            className="rounded-2xl p-5"
            style={{ background: "white", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
          >
            <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: "#111827" }}>
              <span className="text-lg">💪</span> Lo que ofrezco
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {especialidades.map((esp) => {
                const Icono  = ESP_ICONO[esp] ?? Star
                const colors = ESP_COLOR[esp] ?? { bg: "#eff6ff", color: "#2563eb" }
                return (
                  <div
                    key={esp}
                    className="rounded-xl p-4 flex items-center gap-3"
                    style={{ background: colors.bg }}
                  >
                    <div
                      className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: colors.color + "22" }}
                    >
                      <Icono size={18} style={{ color: colors.color }} />
                    </div>
                    <span className="text-sm font-semibold" style={{ color: "#1f2937" }}>{esp}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Stats detallados */}
        <div className="grid grid-cols-3 gap-3">
          {coach.anios_experiencia !== null && (
            <div
              className="rounded-2xl p-4 text-center"
              style={{ background: "white", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
            >
              <Calendar size={20} className="mx-auto mb-1.5" style={{ color: "#2D7DF6" }} />
              <p className="text-xl font-extrabold" style={{ color: "#111827" }}>{coach.anios_experiencia}</p>
              <p className="text-[11px]" style={{ color: "#6b7280" }}>Años de experiencia</p>
            </div>
          )}
          <div
            className="rounded-2xl p-4 text-center"
            style={{ background: "white", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
          >
            <Users size={20} className="mx-auto mb-1.5" style={{ color: "#22C55E" }} />
            <p className="text-xl font-extrabold" style={{ color: "#111827" }}>{coach._count.alumnos}</p>
            <p className="text-[11px]" style={{ color: "#6b7280" }}>Alumnos activos</p>
          </div>
          {especialidades.length > 0 && (
            <div
              className="rounded-2xl p-4 text-center"
              style={{ background: "white", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
            >
              <Star size={20} className="mx-auto mb-1.5" style={{ color: "#F97316" }} />
              <p className="text-xl font-extrabold" style={{ color: "#111827" }}>{especialidades.length}</p>
              <p className="text-[11px]" style={{ color: "#6b7280" }}>Especialidades</p>
            </div>
          )}
        </div>

        {/* Instagram */}
        {instagram && (
          <a
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl p-4 transition-all hover:opacity-90"
            style={{
              background:  "linear-gradient(135deg, #f9a8d4, #c084fc, #60a5fa)",
              textDecoration: "none",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white" style={{ flexShrink: 0 }}>
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
            <div>
              <p className="text-sm font-bold text-white">Instagram</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.8)" }}>
                {coach.instagram_url?.replace("https://instagram.com/", "@").replace("https://www.instagram.com/", "@")}
              </p>
            </div>
          </a>
        )}

        {/* Espaciado para los botones sticky en móvil */}
        <div className="h-36 sm:hidden" />
      </div>

      {/* ── Botones CTA ───────────────────────────────────── */}
      {/* Desktop: ambos botones al final del contenido */}
      <div className="hidden sm:block max-w-2xl mx-auto px-5 pb-10 space-y-3">
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl text-base font-bold transition-all hover:opacity-90"
            style={{ background: "#25D366", color: "white", boxShadow: "0 4px 20px rgba(37,211,102,0.4)" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {ctaTexto}
          </a>
        )}
        <ModalInscripcion slug={slug} nombreCoach={coach.user.nombre} cuposDisponibles={cuposDisponibles} />
      </div>

      {/* Móvil: sticky en el bottom con ambos botones */}
      <div
        className="sm:hidden fixed bottom-0 left-0 right-0 px-4 pb-4 pt-2 z-50 space-y-2"
        style={{ background: "linear-gradient(to top, #f8fafc 70%, transparent)" }}
      >
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl text-sm font-bold"
            style={{ background: "#25D366", color: "white", boxShadow: "0 4px 14px rgba(37,211,102,0.4)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {ctaTexto}
          </a>
        )}
        <ModalInscripcion slug={slug} nombreCoach={coach.user.nombre} cuposDisponibles={cuposDisponibles} />
      </div>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="max-w-2xl mx-auto px-5 py-6 text-center">
        <p className="text-xs" style={{ color: "#9ca3af" }}>
          Perfil gestionado con{" "}
          <Link href="/" className="font-semibold" style={{ color: "#2D7DF6" }}>
            ProFit Manager
          </Link>
          {" "}— Plataforma para coaches de LATAM
        </p>
      </footer>
    </div>
  )
}
