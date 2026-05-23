"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Brand } from "@/components/ui/Brand"
import { ThemeToggle } from "@/components/ui/ThemeToggle"

const LINKS = [
  { href: "#funcionalidades", label: "Funcionalidades" },
  { href: "#precios",         label: "Precios" },
]

// Helper: link con animación de texto deslizando hacia arriba en hover.
function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="relative overflow-hidden h-6 group inline-block"
    >
      <span className="block transition-transform duration-300 group-hover:-translate-y-full">
        {label}
      </span>
      <span
        aria-hidden
        className="block absolute top-full left-0 transition-transform duration-300 group-hover:-translate-y-full"
      >
        {label}
      </span>
    </a>
  )
}

export function LandingNav() {
  const [abierto, setAbierto] = useState(false)

  return (
    <div className="sticky top-3 z-50 px-3 sm:px-4">
      <nav
        className="flex items-center justify-between mx-auto max-w-5xl px-5 sm:px-6 py-3 sm:py-3.5 rounded-full border text-sm relative"
        style={{
          background: "color-mix(in srgb, var(--background-card) 88%, transparent)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderColor: "var(--border)",
          color: "var(--foreground)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <Brand size="sm" href="/" />

        {/* Links centro — desktop */}
        <div className="hidden md:flex items-center gap-7 font-medium" style={{ color: "var(--foreground-muted)" }}>
          {LINKS.map((l) => <NavLink key={l.href} {...l} />)}
        </div>

        {/* CTAs derecha — desktop */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle size="sm" />
          <Link
            href="/login"
            className="px-4 py-2 rounded-full text-sm font-semibold transition-colors border"
            style={{ color: "var(--foreground)", borderColor: "var(--border)" }}
          >
            Iniciar sesión
          </Link>
          <Link
            href="/registro"
            className="px-4 py-2 rounded-full text-sm font-bold transition-all duration-300"
            style={{
              background: "var(--foreground)",
              color: "var(--background-card)",
              boxShadow: "0 0 24px 6px color-mix(in srgb, var(--foreground) 22%, transparent)",
            }}
          >
            Empezar gratis
          </Link>
        </div>

        {/* Mobile: hamburguesa */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle size="sm" />
          <button
            onClick={() => setAbierto((v) => !v)}
            aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
            className="rounded-full p-1.5"
            style={{ color: "var(--foreground)" }}
          >
            {abierto ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu — dropdown debajo del nav */}
      {abierto && (
        <div
          className="md:hidden mx-auto max-w-5xl mt-2 rounded-2xl border p-4 flex flex-col gap-3 animate-fade-in"
          style={{
            background: "color-mix(in srgb, var(--background-card) 95%, transparent)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setAbierto(false)}
              className="px-3 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ color: "var(--foreground-muted)" }}
            >
              {l.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
            <Link
              href="/login"
              onClick={() => setAbierto(false)}
              className="text-center px-4 py-2 rounded-full text-sm font-semibold border"
              style={{ color: "var(--foreground)", borderColor: "var(--border)" }}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              onClick={() => setAbierto(false)}
              className="text-center px-4 py-2 rounded-full text-sm font-bold transition-all duration-300"
              style={{
                background: "var(--foreground)",
                color: "var(--background-card)",
                boxShadow: "0 0 24px 6px color-mix(in srgb, var(--foreground) 22%, transparent)",
              }}
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
