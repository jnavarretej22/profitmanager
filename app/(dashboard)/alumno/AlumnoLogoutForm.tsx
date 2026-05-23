import { signOut } from "@/lib/auth"
import { LogOut } from "lucide-react"

// Form de logout server-only — el client wrapper lo recibe como children
// para que el server action no quede dentro de un componente "use client".
export function AlumnoLogoutForm() {
  return (
    <form
      action={async () => {
        "use server"
        await signOut({ redirectTo: "/login" })
      }}
    >
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors"
        style={{ color: "var(--foreground-muted)" }}
      >
        <LogOut size={18} />
        Cerrar sesión
      </button>
    </form>
  )
}
