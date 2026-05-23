"use client"

import { signOut } from "next-auth/react"

// Cierra sesión sin depender de NEXTAUTH_URL.
//
// NextAuth resuelve `callbackUrl: "/login"` contra `NEXTAUTH_URL` y construye una
// URL absoluta. Si esa env var apunta a otro dominio (ej. branch preview de Vercel
// con SSO activado), el logout te redirige al dominio "equivocado" y termina en
// el login de Vercel.
//
// Aquí evitamos eso: `redirect: false` impide que NextAuth redirija, luego
// navegamos manualmente al `/login` del dominio actual del navegador.
export async function cerrarSesion(destino: string = "/login") {
  await signOut({ redirect: false })
  if (typeof window !== "undefined") {
    window.location.href = destino
  }
}
