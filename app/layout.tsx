import type { Metadata } from "next"
import { SessionProviderWrapper } from "@/components/layout/SessionProviderWrapper"
import { Toaster } from "sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "ProFit Manager",
    template: "%s | ProFit Manager",
  },
  description: "Plataforma de gestión para coaches físicos. Rutinas, planes alimenticios, progreso y citas en un solo lugar.",
  keywords: ["coach", "entrenador", "rutinas", "fitness", "LATAM", "gestión alumnos"],
  authors: [{ name: "ProFit Manager" }],
  openGraph: {
    title: "ProFit Manager",
    description: "Tu coaching, sin WhatsApp ni hojas de cálculo.",
    type: "website",
    locale: "es_EC",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const tema = localStorage.getItem('tema');
                const prefiere = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (tema === 'dark' || (!tema && prefiere)) {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body>
        <SessionProviderWrapper>
          {children}
        </SessionProviderWrapper>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--background-card)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif",
              fontSize: "13px",
              fontWeight: "500",
            },
          }}
          richColors
        />
      </body>
    </html>
  )
}
