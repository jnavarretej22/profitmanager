"use client"

import { LogOut } from "lucide-react"
import { cerrarSesion } from "@/lib/cerrar-sesion"

// Logout client-side para no depender de NEXTAUTH_URL: usa cerrarSesion() que
// hace signOut sin redirect y luego navega a /login del dominio actual del
// navegador. Antes era un form con server action, pero NextAuth resolvía el
// callback contra NEXTAUTH_URL y podía terminar en el branch preview con SSO.
export function AlumnoLogoutForm() {
  return (
    <button
      type="button"
      onClick={() => cerrarSesion()}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors"
      style={{ color: "var(--foreground-muted)" }}
    >
      <LogOut size={18} />
      Cerrar sesión
    </button>
  )
}
