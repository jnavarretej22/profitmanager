"use client"

import { useState } from "react"
import { FileDown, Loader2 } from "lucide-react"

interface Props {
  href: string            // /api/exportar/rutina/[id] o /api/exportar/plan/[id]
  label?: string
  variant?: "primary" | "secondary"
}

export function ExportarPDFBtn({ href, label = "Exportar PDF", variant = "secondary" }: Props) {
  const [descargando, setDescargando] = useState(false)

  async function descargar() {
    setDescargando(true)
    try {
      const res = await fetch(href)
      if (!res.ok) throw new Error("Error al generar PDF")
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href     = url
      // Extraer nombre del header Content-Disposition si existe
      const cd   = res.headers.get("content-disposition") ?? ""
      const match = cd.match(/filename="([^"]+)"/)
      a.download = match?.[1] ?? "documento.pdf"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert("No se pudo generar el PDF. Intenta de nuevo.")
    } finally {
      setDescargando(false)
    }
  }

  return (
    <button
      onClick={descargar}
      disabled={descargando}
      className={variant === "primary" ? "btn-primary" : "btn-secondary"}
      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
    >
      {descargando ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <FileDown size={14} />
      )}
      {descargando ? "Generando…" : label}
    </button>
  )
}
