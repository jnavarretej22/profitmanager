import Link from "next/link"
import { Check, Users, Dumbbell, UtensilsCrossed, Calendar, BarChart2, FileDown, ChevronRight } from "lucide-react"
import { Brand } from "@/components/ui/Brand"
import { Badge } from "@/components/ui/Badge"
import { CarruselHero } from "./CarruselHero"

// ─── Datos de features ──────────────────────────────────────────────────────

const FEATURES = [
  {
    icono: Users,
    titulo: "Gestión de alumnos",
    desc: "Registra, edita y da seguimiento a todos tus alumnos desde un solo lugar. Sin hojas de cálculo.",
  },
  {
    icono: Dumbbell,
    titulo: "Rutinas personalizadas",
    desc: "Crea rutinas a medida o usa templates por objetivo. Asígnalas con un clic.",
  },
  {
    icono: UtensilsCrossed,
    titulo: "Planes alimenticios",
    desc: "Diseña planes con comida LATAM real. Comidas por momento del día con macros.",
  },
  {
    icono: Calendar,
    titulo: "Agenda con Meet",
    desc: "Programa citas con link de Google Meet automático. Notificaciones incluidas.",
  },
  {
    icono: BarChart2,
    titulo: "Seguimiento de progreso",
    desc: "Gráficas de peso, medidas y porcentaje de grasa. Tu alumno ve su evolución.",
  },
  {
    icono: FileDown,
    titulo: "Exportación a PDF",
    desc: "Genera PDF de rutinas y planes con tu logo. Presentación profesional garantizada.",
  },
]

const PLAN_GRATIS = [
  "Hasta 3 alumnos",
  "Registro completo de alumnos",
  "Rutinas manuales",
  "1 plantilla de plan alimenticio",
  "Recordatorios de citas",
  "Acceso de alumnos (solo lectura)",
]

const PLAN_INICIAL = [
  "Hasta 10 alumnos",
  "Todo lo del plan Gratis",
  "Templates de rutinas por objetivo",
  "Templates de dietas con comida LATAM",
  "Seguimiento y gráficas de progreso",
  "Citas con Google Meet automático",
  "Exportar PDFs sin marca de agua",
  "Soporte prioritario",
]

// ─── Componente Hero ─────────────────────────────────────────────────────────

function Hero() {
  return (
    <section
      className="px-6 pt-20 pb-24 text-center"
      style={{ background: "linear-gradient(180deg, var(--blue-bg) 0%, var(--background) 100%)" }}
    >
      <div className="mx-auto max-w-3xl">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold mb-6"
          style={{ background: "var(--blue-bg)", color: "var(--blue)" }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--blue)" }} />
          Diseñado para coaches de LATAM
        </span>

        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-5"
          style={{ color: "var(--foreground)", letterSpacing: "-0.03em", lineHeight: "1.1" }}
        >
          Tu coaching,{" "}
          <span className="text-gradient-blue">sin WhatsApp</span>
          {" "}ni hojas de cálculo
        </h1>

        <p
          className="text-lg sm:text-xl mb-8 max-w-2xl mx-auto"
          style={{ color: "var(--foreground-muted)", lineHeight: "1.6" }}
        >
          ProFit Manager te da el panel que necesitas para gestionar alumnos, rutinas, planes
          alimenticios y citas. Todo en un solo lugar, profesional y sin complicaciones.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/registro" className="btn-primary px-7 py-3.5 text-base">
            Empezar gratis
            <ChevronRight size={18} />
          </Link>
          <Link
            href="/login"
            className="btn-secondary px-7 py-3.5 text-base"
          >
            Ya tengo cuenta
          </Link>
        </div>

        <p className="mt-5 text-sm" style={{ color: "var(--foreground-subtle)" }}>
          Sin tarjeta de crédito · Plan gratis para siempre · 3 alumnos incluidos
        </p>
      </div>

      {/* Mockup visual */}
      <div className="mt-16 mx-auto max-w-4xl">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            boxShadow: "0 32px 80px rgba(45,125,246,0.15), 0 8px 24px rgba(0,0,0,0.06)",
            border: "1px solid var(--border)",
            transform: "perspective(1200px) rotateX(4deg)",
          }}
        >
          {/* Barra de browser */}
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ background: "var(--background-card)", borderBottom: "1px solid var(--border)" }}
          >
            <span className="h-3 w-3 rounded-full" style={{ background: "#FF5F56" }} />
            <span className="h-3 w-3 rounded-full" style={{ background: "#FFBD2E" }} />
            <span className="h-3 w-3 rounded-full" style={{ background: "#27C93F" }} />
            <span
              className="ml-4 flex-1 rounded-lg px-3 py-1 text-xs"
              style={{ background: "var(--background)", color: "var(--foreground-subtle)" }}
            >
              profitmanager.app/coach
            </span>
          </div>

          {/* App preview */}
          <div
            className="flex"
            style={{ background: "var(--background)", minHeight: "300px" }}
          >
            {/* Sidebar mini */}
            <div
              className="hidden sm:flex flex-col w-52 p-3 gap-1"
              style={{ background: "var(--background-card)", borderRight: "1px solid var(--border)" }}
            >
              {["Dashboard", "Mis alumnos", "Rutinas", "Planes", "Agenda"].map((item, i) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-lg px-3 py-2"
                  style={{
                    background: i === 1 ? "var(--blue-bg)" : "transparent",
                    color: i === 1 ? "var(--blue)" : "var(--foreground-muted)",
                  }}
                >
                  <span
                    className="h-3 w-3 rounded"
                    style={{ background: i === 1 ? "var(--blue)" : "var(--border)" }}
                  />
                  <span className="text-xs font-medium">{item}</span>
                </div>
              ))}
            </div>

            {/* Contenido principal */}
            <div className="flex-1 p-5">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Alumnos", valor: "8", color: "#2D7DF6" },
                  { label: "Rutinas", valor: "12", color: "#22C55E" },
                  { label: "Citas hoy", valor: "3", color: "#F97316" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl p-3"
                    style={{ background: stat.color, color: "white" }}
                  >
                    <p className="text-xs opacity-80">{stat.label}</p>
                    <p className="text-2xl font-extrabold">{stat.valor}</p>
                  </div>
                ))}
              </div>

              <div
                className="rounded-xl p-4"
                style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}
              >
                <p className="text-xs font-semibold mb-3" style={{ color: "var(--foreground)" }}>Alumnos recientes</p>
                {["Andrés G.", "Diana S.", "Ricardo M."].map((a) => (
                  <div key={a} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                    <span
                      className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #2D7DF6, #8B5CF6)" }}
                    >
                      {a[0]}
                    </span>
                    <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{a}</span>
                    <span className="ml-auto text-xs" style={{ color: "var(--green)" }}>Activo</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Componente Features ─────────────────────────────────────────────────────

function Features() {
  return (
    <section id="funcionalidades" className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h2
            className="text-3xl sm:text-4xl font-extrabold mb-3"
            style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
          >
            Todo lo que necesitas para crecer
          </h2>
          <p className="text-base" style={{ color: "var(--foreground-muted)" }}>
            Sin aplicaciones extra, sin WhatsApp, sin hojas de cálculo.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icono: Icono, titulo, desc }) => (
            <div
              key={titulo}
              className="rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1"
              style={{
                background: "var(--background-card)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <span
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: "var(--blue-bg)" }}
              >
                <Icono size={22} style={{ color: "var(--blue)" }} />
              </span>
              <h3
                className="mb-2 text-base font-bold"
                style={{ color: "var(--foreground)", letterSpacing: "-0.01em" }}
              >
                {titulo}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Componente Pricing ───────────────────────────────────────────────────────

function Pricing() {
  return (
    <section
      id="precios"
      className="px-6 py-20"
      style={{ background: "var(--background-card)" }}
    >
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h2
            className="text-3xl sm:text-4xl font-extrabold mb-3"
            style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
          >
            Planes para cada etapa
          </h2>
          <p style={{ color: "var(--foreground-muted)" }}>
            Empieza gratis y crece cuando lo necesites.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-10">
          {/* Plan Gratis */}
          <div
            className="rounded-2xl p-7"
            style={{
              background: "var(--background)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <Badge variant="neutral">Plan Gratis</Badge>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-extrabold" style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}>
                $0
              </span>
              <span className="text-sm ml-1" style={{ color: "var(--foreground-muted)" }}>/mes, para siempre</span>
            </div>
            <ul className="space-y-2.5 mb-7">
              {PLAN_GRATIS.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--foreground-muted)" }}>
                  <Check size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--green)" }} />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/registro"
              className="btn-secondary w-full justify-center py-3"
              style={{ display: "flex" }}
            >
              Empezar gratis
            </Link>
          </div>

          {/* Plan Inicial */}
          <div
            className="rounded-2xl p-7 relative"
            style={{
              background: "var(--background)",
              border: "2px solid var(--blue)",
              boxShadow: "0 0 0 4px var(--blue-bg), var(--shadow-md)",
            }}
          >
            <div className="flex items-center justify-between">
              <Badge variant="plan-inicial">Plan Inicial</Badge>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                style={{ background: "var(--blue)", color: "white" }}
              >
                RECOMENDADO
              </span>
            </div>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-extrabold" style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}>
                $15
              </span>
              <span className="text-sm ml-1" style={{ color: "var(--foreground-muted)" }}>/mes</span>
              <p className="text-xs mt-1" style={{ color: "var(--green)" }}>
                O $144/año — ahorras $36
              </p>
            </div>
            <ul className="space-y-2.5 mb-7">
              {PLAN_INICIAL.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--foreground-muted)" }}>
                  <Check size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--blue)" }} />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/registro"
              className="btn-primary w-full justify-center py-3"
              style={{ display: "flex" }}
            >
              Empezar con Inicial
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>

        {/* Próximamente */}
        <div
          className="rounded-2xl px-6 py-5 text-center"
          style={{ background: "var(--background-hover)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm font-medium" style={{ color: "var(--foreground-muted)" }}>
            ✨ Próximamente: <strong style={{ color: "var(--foreground)" }}>Medio (30 alumnos) · Medio Plus (80 alumnos) · Ilimitado</strong>
          </p>
        </div>
      </div>
    </section>
  )
}

// ─── Guías de usuario ────────────────────────────────────────────────────────

function Guias() {
  return (
    <section className="px-6 py-16" style={{ background: "var(--background-hover)" }}>
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-10">
          <h2
            className="text-2xl sm:text-3xl font-extrabold mb-3"
            style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
          >
            ¿Cómo funciona ProFit Manager?
          </h2>
          <p className="text-base" style={{ color: "var(--foreground-muted)" }}>
            Guías paso a paso para que sepas exactamente qué hace cada sección.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
          <Link
            href="/guia/coach"
            className="group rounded-2xl p-6 transition-all hover:-translate-y-1"
            style={{
              background: "var(--background-card)",
              border:     "1px solid var(--border)",
              boxShadow:  "var(--shadow-sm)",
            }}
          >
            <div
              className="inline-flex items-center justify-center h-12 w-12 rounded-xl mb-4"
              style={{ background: "var(--blue-bg)", color: "var(--blue)" }}
            >
              <Users size={22} />
            </div>
            <h3 className="text-lg font-extrabold mb-2" style={{ color: "var(--foreground)" }}>
              Guía del coach
            </h3>
            <p className="text-sm mb-4" style={{ color: "var(--foreground-muted)", lineHeight: "1.55" }}>
              Cómo gestionar alumnos, crear rutinas y planes alimenticios, agendar citas y seguir el progreso.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--blue)" }}>
              Leer guía
              <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
            </span>
          </Link>

          <Link
            href="/guia/alumno"
            className="group rounded-2xl p-6 transition-all hover:-translate-y-1"
            style={{
              background: "var(--background-card)",
              border:     "1px solid var(--border)",
              boxShadow:  "var(--shadow-sm)",
            }}
          >
            <div
              className="inline-flex items-center justify-center h-12 w-12 rounded-xl mb-4"
              style={{ background: "var(--orange-bg)", color: "var(--orange)" }}
            >
              <Dumbbell size={22} />
            </div>
            <h3 className="text-lg font-extrabold mb-2" style={{ color: "var(--foreground)" }}>
              Guía del alumno
            </h3>
            <p className="text-sm mb-4" style={{ color: "var(--foreground-muted)", lineHeight: "1.55" }}>
              Cómo ver tu rutina, marcar tus comidas cumplidas, ver tu progreso y contactar a tu coach.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--orange)" }}>
              Leer guía
              <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── CTA Final ───────────────────────────────────────────────────────────────

function CTAFinal() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <div
          className="rounded-3xl p-10 text-center"
          style={{
            background: "linear-gradient(135deg, #2D7DF6, #1F66D9)",
            boxShadow: "0 24px 64px rgba(45,125,246,0.3)",
          }}
        >
          <h2
            className="text-3xl sm:text-4xl font-extrabold mb-4 text-white"
            style={{ letterSpacing: "-0.02em" }}
          >
            Empieza gratis hoy
          </h2>
          <p className="text-base mb-8" style={{ color: "rgba(255,255,255,0.85)" }}>
            Únete a coaches de Ecuador, México, Colombia y más países que ya gestionan a sus
            alumnos con ProFit Manager.
          </p>
          <Link
            href="/registro"
            className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-bold transition-all hover:-translate-y-0.5"
            style={{
              background: "white",
              color: "var(--blue)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            }}
          >
            Crear cuenta gratis
            <ChevronRight size={18} />
          </Link>
          <p className="mt-4 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
            Sin tarjeta de crédito requerida
          </p>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer
      className="border-t px-6 py-8"
      style={{ borderColor: "var(--border)", background: "var(--background-card)" }}
    >
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <Brand size="sm" href="/" />
        <div className="flex items-center gap-3 sm:gap-5 text-xs flex-wrap justify-center" style={{ color: "var(--foreground-muted)" }}>
          <Link href="/guia/coach" className="hover:underline">Guía Coach</Link>
          <Link href="/guia/alumno" className="hover:underline">Guía Alumno</Link>
          <Link href="/terminos" className="hover:underline">Términos</Link>
          <Link href="/privacidad" className="hover:underline">Privacidad</Link>
          <span>© {new Date().getFullYear()} ProFit Manager</span>
        </div>
      </div>
    </footer>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ background: "var(--background)" }}>
      <CarruselHero />
      <Hero />
      <Features />
      <Pricing />
      <Guias />
      <CTAFinal />
      <Footer />
    </div>
  )
}
