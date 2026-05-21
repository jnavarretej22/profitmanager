import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Lock, Globe } from "lucide-react"
import { generarSlug } from "@/lib/slug"
import { PerfilPublicoForm } from "./PerfilPublicoForm"

export const metadata = { title: "Mi perfil público" }

export default async function MiPerfilPublicoPage() {
  const session = await auth()
  if (!session || session.user.role !== "coach") redirect("/login")

  const coach = await prisma.coach.findUnique({
    where: { id: session.user.coachId ?? "" },
    select: {
      plan_actual:           true,
      slug:                  true,
      perfil_publico_activo: true,
      foto_publica_url:      true,
      titulo_profesional:    true,
      bio:                   true,
      especialidades_tags:   true,
      anios_experiencia:     true,
      ciudad:                true,
      instagram_url:         true,
      cta_whatsapp_texto:    true,
      user: { select: { nombre: true, apellido: true, telefono: true } },
    },
  })

  if (!coach) redirect("/login")

  // Si es plan gratis: mostrar teaser
  if (coach.plan_actual !== "inicial") {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="section-title">Mi perfil público</h1>
          <p className="section-subtitle">Tu página de presentación profesional</p>
        </div>

        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--orange-bg)" }}
          >
            <Lock size={24} style={{ color: "var(--orange)" }} />
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--foreground)" }}>
            Exclusivo del Plan Inicial
          </h2>
          <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "var(--foreground-muted)" }}>
            Crea tu página pública de presentación y atrae nuevos clientes con tu propio enlace personalizado.
            Disponible en el Plan Inicial.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-left">
            {[
              { icon: "🔗", titulo: "URL personalizada", desc: "profitmanager.app/tu-nombre" },
              { icon: "📱", titulo: "Botón WhatsApp", desc: "Captación directa de clientes" },
              { icon: "💼", titulo: "Perfil LinkedIn-style", desc: "Especialidades, bio, experiencia" },
            ].map((f) => (
              <div
                key={f.titulo}
                className="rounded-xl p-4"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}
              >
                <span className="text-2xl">{f.icon}</span>
                <p className="text-sm font-bold mt-2" style={{ color: "var(--foreground)" }}>{f.titulo}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>{f.desc}</p>
              </div>
            ))}
          </div>

          <Link href="/coach/mi-plan" className="btn-primary inline-flex items-center gap-2">
            <Globe size={15} />
            Ver planes y actualizar
          </Link>
        </div>
      </div>
    )
  }

  // Slug por defecto si no tiene
  const slugDefault = coach.slug ?? generarSlug(coach.user.nombre, coach.user.apellido)
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="section-title">Mi perfil público</h1>
        <p className="section-subtitle">Tu página de presentación para atraer nuevos clientes</p>
      </div>

      <PerfilPublicoForm
        inicial={{
          slug:                  slugDefault,
          perfil_publico_activo: coach.perfil_publico_activo,
          foto_publica_url:      coach.foto_publica_url ?? "",
          titulo_profesional:    coach.titulo_profesional ?? "",
          bio:                   coach.bio ?? "",
          especialidades_tags:   (coach.especialidades_tags as string[]) ?? [],
          anios_experiencia:     coach.anios_experiencia ?? null,
          ciudad:                coach.ciudad ?? "",
          instagram_url:         coach.instagram_url ?? "",
          cta_whatsapp_texto:    coach.cta_whatsapp_texto ?? "Quiero una asesoría personalizada",
          telefono:              coach.user.telefono ?? "",
          nombre:                coach.user.nombre,
          apellido:              coach.user.apellido,
        }}
        baseUrl={baseUrl}
      />
    </div>
  )
}
