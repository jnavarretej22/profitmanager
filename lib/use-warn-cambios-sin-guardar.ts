"use client"

import { useEffect, useState } from "react"

// Detecta cambios sin guardar comparando el estado serializado contra una baseline
// capturada al montar el componente. Cuando hay cambios y `activo` es true,
// advierte al usuario antes de cerrar/recargar la pestaña.
//
// Uso típico:
//   const dirty = useWarnCambiosSinGuardar({ nombre, descripcion, dias }, !cargando)
//
// Notas:
// - El navegador muestra un texto genérico — el `returnValue` solo activa la confirmación.
// - Asume que el form navega fuera al guardar (router.push). Si no, el hook seguiría
//   marcando dirty contra la baseline original.
export function useWarnCambiosSinGuardar(state: unknown, activo: boolean = true): boolean {
  const [baseline] = useState(() => JSON.stringify(state))
  const dirty = activo && baseline !== JSON.stringify(state)

  useEffect(() => {
    if (!dirty) return
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [dirty])

  return dirty
}
