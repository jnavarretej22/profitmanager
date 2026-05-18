"use client"

import { useState } from "react"
import { Lock } from "lucide-react"
import { usePlan } from "@/lib/plan-context"
import { UpgradeModal } from "./UpgradeModal"
import type { Feature } from "@/lib/plan-features"
import { cn } from "@/lib/utils"

interface FeatureGateProps {
  feature: Feature
  featureLabel?: string
  children: React.ReactNode
  // Si fallback=true muestra el contenido bloqueado con overlay en vez de nada
  fallback?: boolean
  className?: string
}

export function FeatureGate({
  feature,
  featureLabel,
  children,
  fallback = false,
  className,
}: FeatureGateProps) {
  const { tieneFeature } = usePlan()
  const [modalAbierto, setModalAbierto] = useState(false)

  if (tieneFeature(feature)) {
    return <>{children}</>
  }

  if (!fallback) return null

  return (
    <>
      <div
        className={cn("relative overflow-hidden rounded-xl cursor-pointer", className)}
        onClick={() => setModalAbierto(true)}
      >
        {/* Contenido bloqueado con opacity */}
        <div className="pointer-events-none opacity-40 select-none">{children}</div>

        {/* Overlay */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl"
          style={{ background: "rgba(var(--background-card-rgb, 255,255,255), 0.85)", backdropFilter: "blur(4px)" }}
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "var(--blue-bg)" }}
          >
            <Lock size={16} style={{ color: "var(--blue)" }} />
          </span>
          <span className="text-xs font-semibold text-center px-4" style={{ color: "var(--foreground-muted)" }}>
            Plan Inicial
          </span>
        </div>
      </div>

      <UpgradeModal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        feature={featureLabel}
      />
    </>
  )
}
