import { LandingNav } from "./LandingNav"

// Layout compartido para todas las páginas marketing (landing, guías, términos, privacidad).
// Incluye el navbar pill arriba — así las guías y páginas legales mantienen la navegación
// hacia el resto del sitio.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LandingNav />
      {children}
    </>
  )
}
