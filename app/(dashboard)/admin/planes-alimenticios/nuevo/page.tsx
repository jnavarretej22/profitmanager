import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { PlanAlimenticioForm } from "@/components/domain/PlanAlimenticioForm"

export const metadata = { title: "Nuevo template de plan alimenticio" }

export default async function NuevoTemplatePlanPage() {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/login")

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <Link
          href="/admin/planes-alimenticios"
          className="flex items-center gap-1.5 text-sm font-medium mb-4"
          style={{ color: "var(--foreground-muted)" }}
        >
          <ChevronLeft size={16} />
          Volver a templates
        </Link>
        <h1 className="section-title">Nuevo template de plan alimenticio</h1>
        <p className="section-subtitle">Plantilla global que los coaches pueden clonar para sus alumnos</p>
      </div>
      <PlanAlimenticioForm modoAdmin alumnos={[]} />
    </div>
  )
}
