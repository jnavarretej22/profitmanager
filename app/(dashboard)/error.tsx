"use client"

import Link from "next/link"
import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "var(--red-bg)" }}
      >
        <AlertTriangle size={24} style={{ color: "var(--red)" }} />
      </div>
      <h2
        className="text-xl font-bold mb-2"
        style={{ color: "var(--foreground)", letterSpacing: "-0.01em" }}
      >
        Algo salió mal
      </h2>
      <p className="text-sm mb-6 max-w-sm" style={{ color: "var(--foreground-muted)" }}>
        Ocurrió un error inesperado. Intenta recargar la página. Si el problema persiste,
        contacta a soporte.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="btn-primary flex items-center gap-2"
        >
          <RefreshCw size={15} />
          Intentar de nuevo
        </button>
        <Link href="/" className="btn-secondary">
          Ir al inicio
        </Link>
      </div>
      {error.digest && (
        <p className="text-xs mt-4" style={{ color: "var(--foreground-subtle)" }}>
          Código: {error.digest}
        </p>
      )}
    </div>
  )
}
