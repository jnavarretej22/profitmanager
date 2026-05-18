import { redirect } from "next/navigation"
import { auth, signOut } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { Avatar, Brand } from "@/components/ui"
import { WatermarkFooter, NotificacionesPanel } from "@/components/layout"
import {
  LayoutDashboard, Dumbbell, UtensilsCrossed,
  TrendingUp, Calendar, User, LogOut,
  MessageCircle,
} from "lucide-react"

const NAV_ITEMS = [
  { href: "/alumno",                  label: "Inicio",             icono: LayoutDashboard },
  { href: "/alumno/mi-rutina",        label: "Mi rutina",          icono: Dumbbell },
  { href: "/alumno/mi-plan-alimenticio", label: "Mi alimentación", icono: UtensilsCrossed },
  { href: "/alumno/mi-progreso",      label: "Mi progreso",        icono: TrendingUp },
  { href: "/alumno/mi-agenda",        label: "Mi agenda",          icono: Calendar },
  { href: "/alumno/perfil",           label: "Mi perfil",          icono: User },
]

export default async function AlumnoLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== "alumno") redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      nombre: true,
      apellido: true,
      email: true,
      notificaciones: {
        orderBy: { created_at: "desc" },
        take: 30,
        select: { id: true, tipo: true, titulo: true, mensaje: true, link: true, leida: true, created_at: true },
      },
      alumno: {
        select: {
          coach: {
            select: {
              plan_actual: true,
              bio: true,
              especialidad: true,
              user: { select: { nombre: true, apellido: true, email: true, telefono: true } },
            },
          },
        },
      },
    },
  })

  if (!user || !user.alumno) redirect("/login")

  const coach = user.alumno.coach
  const marcaAgua = coach.plan_actual === "gratis"
  const notifSinLeer = user.notificaciones.filter((n) => !n.leida).length
  const notificaciones = user.notificaciones.map((n) => ({ ...n, created_at: n.created_at.toISOString() }))

  const whatsappLink = coach.user.telefono
    ? `https://wa.me/${coach.user.telefono.replace(/\D/g, "")}`
    : null
  const mailtoLink = `mailto:${coach.user.email}`

  return (
    <div
      className="flex min-h-screen"
      style={{ background: "var(--background)" }}
    >
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col w-60 flex-shrink-0 fixed top-0 left-0 h-full z-30"
        style={{
          background: "var(--background-card)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
          <Brand size="sm" />
          <ThemeToggle />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icono: Icono }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors"
              style={{ color: "var(--foreground-muted)" }}
            >
              <Icono size={18} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Card del coach */}
        <div className="mx-3 mb-3 rounded-2xl overflow-hidden">
          <div
            className="p-4"
            style={{
              background: "linear-gradient(135deg, #F97316, #EA580C)",
            }}
          >
            <p className="text-xs font-semibold text-white/70 mb-1">Tu coach</p>
            <p className="text-sm font-bold text-white mb-0.5">
              {coach.user.nombre} {coach.user.apellido}
            </p>
            {coach.especialidad && (
              <p className="text-xs text-white/70 mb-3">{coach.especialidad}</p>
            )}
            <div className="flex gap-2">
              <a
                href={whatsappLink ?? mailtoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all hover:opacity-90"
                style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
              >
                <MessageCircle size={13} />
                Contactar
              </a>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="px-3 pb-4 border-t pt-3" style={{ borderColor: "var(--border)" }}>
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors"
              style={{ color: "var(--foreground-muted)" }}
            >
              <LogOut size={18} />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* ── Topbar mobile ──────────────────────────────── */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3"
        style={{ background: "var(--background-card)", borderBottom: "1px solid var(--border)" }}
      >
        <Brand size="sm" />
        <div className="flex items-center gap-2">
          <NotificacionesPanel notificacionesSinLeer={notifSinLeer} notificaciones={notificaciones} />
          <ThemeToggle />
          <Avatar nombre={user.nombre} apellido={user.apellido} size="sm" />
        </div>
      </div>

      {/* ── Topbar desktop ─────────────────────────────── */}
      <header
        className="hidden lg:flex fixed top-0 left-60 right-0 z-20 items-center justify-between px-6 py-3.5"
        style={{ background: "var(--background-card)", borderBottom: "1px solid var(--border)", height: "56px" }}
      >
        <p className="text-xs capitalize" style={{ color: "var(--foreground-muted)" }}>
          {new Date().toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <div className="flex items-center gap-3">
          <a
            href={whatsappLink ?? mailtoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-xs py-1.5 px-3"
          >
            <MessageCircle size={14} />
            Contactar a mi coach
          </a>
          <NotificacionesPanel notificacionesSinLeer={notifSinLeer} notificaciones={notificaciones} />
          <Avatar nombre={user.nombre} apellido={user.apellido} size="sm" />
        </div>
      </header>

      {/* ── Contenido principal ─────────────────────────── */}
      <main
        className="flex-1 lg:ml-60 pt-16 lg:pt-[56px] px-4 lg:px-8 pb-8"
        style={{ paddingBottom: marcaAgua ? "3.5rem" : "2rem" }}
      >
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>

      {/* ── Marca de agua (plan Gratis del coach) ──────── */}
      {marcaAgua && <WatermarkFooter />}
    </div>
  )
}
