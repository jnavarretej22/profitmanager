import { Brand } from "@/components/ui"
import { ThemeToggle } from "@/components/ui"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-4 py-12 relative"
      style={{ background: "var(--background)" }}
    >
      {/* Header con brand y toggle */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4">
        <Brand size="sm" />
        <ThemeToggle size="sm" />
      </div>

      {/* Card de auth */}
      <div className="w-full max-w-sm animate-fade-in">
        {children}
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs" style={{ color: "var(--foreground-subtle)" }}>
        © {new Date().getFullYear()} ProFit Manager · Todos los derechos reservados
      </p>
    </div>
  )
}
