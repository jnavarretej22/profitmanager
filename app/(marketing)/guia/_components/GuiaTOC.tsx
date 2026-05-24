"use client"

import { useEffect, useState } from "react"

interface Seccion {
  id:    string
  label: string
}

interface Props {
  secciones: Seccion[]
}

// Tabla de contenidos sticky en desktop. Resalta la sección visible usando
// IntersectionObserver, sin librerías externas.
export function GuiaTOC({ secciones }: Props) {
  const [activa, setActiva] = useState<string>(secciones[0]?.id ?? "")

  useEffect(() => {
    if (typeof window === "undefined") return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting)
        if (visible) setActiva(visible.target.id)
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    )
    secciones.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [secciones])

  return (
    <nav className="hidden lg:block sticky top-24 self-start">
      <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--foreground-subtle)" }}>
        En esta página
      </p>
      <ul className="space-y-1">
        {secciones.map(({ id, label }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className="block rounded-lg px-3 py-1.5 text-sm transition-colors"
              style={{
                color:      activa === id ? "var(--blue)"    : "var(--foreground-muted)",
                background: activa === id ? "var(--blue-bg)" : "transparent",
                fontWeight: activa === id ? 600 : 500,
              }}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// Versión mobile: dropdown con saltos rápidos.
export function GuiaTOCMobile({ secciones }: Props) {
  return (
    <details
      className="lg:hidden rounded-2xl border mb-6"
      style={{ background: "var(--background-card)", borderColor: "var(--border)" }}
    >
      <summary
        className="px-4 py-3 cursor-pointer text-sm font-semibold list-none flex items-center justify-between"
        style={{ color: "var(--foreground)" }}
      >
        <span>En esta página</span>
        <span style={{ color: "var(--foreground-subtle)" }}>▾</span>
      </summary>
      <ul className="px-4 pb-3 space-y-1 border-t" style={{ borderColor: "var(--border)" }}>
        {secciones.map(({ id, label }, idx) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className="block py-1.5 text-sm"
              style={{ color: "var(--foreground-muted)" }}
            >
              {idx + 1}. {label}
            </a>
          </li>
        ))}
      </ul>
    </details>
  )
}
