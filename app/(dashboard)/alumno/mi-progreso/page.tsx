import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { TrendingUp } from "lucide-react"
import { StatCard, EmptyState } from "@/components/ui"
import { GraficaProgreso } from "@/components/domain/GraficaProgreso"
import { formatFechaCorta } from "@/lib/utils"
import { PlanFeatureService } from "@/lib/plan-features"

export default async function MiProgresoPage() {
  const session = await auth()
  if (!session?.user.alumnoId) redirect("/login")

  const alumno = await prisma.alumno.findUnique({
    where: { id: session.user.alumnoId },
    include: {
      coach: { select: { plan_actual: true } },
      mediciones: { orderBy: { fecha: "desc" } },
    },
  })

  if (!alumno) redirect("/login")

  const mediciones = alumno.mediciones
  const tieneGraficas = PlanFeatureService.tieneFeature(alumno.coach.plan_actual, "graficas_progreso")
  const ultima = mediciones[0] ?? null
  const penultima = mediciones[1] ?? null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function delta(actual: any, anterior: any) {
    if (actual == null || anterior == null) return null
    const diff = Number(actual) - Number(anterior)
    return { valor: Math.abs(diff).toFixed(1), positivo: diff > 0 }
  }

  const deltaPeso = delta(ultima?.peso_kg, penultima?.peso_kg)
  const deltaCintura = delta(ultima?.cintura_cm, penultima?.cintura_cm)

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="section-title">Mi progreso</h1>
        <p className="section-subtitle">Seguimiento de tus medidas y evolución</p>
      </div>

      {mediciones.length === 0 ? (
        <EmptyState
          icono={TrendingUp}
          titulo="Sin mediciones aún"
          subtitulo="Tu coach irá registrando tus medidas en cada sesión."
        />
      ) : (
        <>
          {/* Stats últimas mediciones */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {ultima?.peso_kg && (
              <div
                className="rounded-2xl p-5"
                style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--foreground-muted)" }}>PESO</p>
                <p className="text-3xl font-extrabold" style={{ color: "var(--blue)", letterSpacing: "-0.03em" }}>
                  {Number(ultima.peso_kg).toFixed(1)}<span className="text-base font-normal ml-1">kg</span>
                </p>
                {deltaPeso && (
                  <p className="text-xs mt-1" style={{ color: deltaPeso.positivo ? "var(--red)" : "var(--green)" }}>
                    {deltaPeso.positivo ? "▲" : "▼"} {deltaPeso.valor} kg vs anterior
                  </p>
                )}
                <p className="text-xs mt-1" style={{ color: "var(--foreground-subtle)" }}>
                  {formatFechaCorta(ultima.fecha)}
                </p>
              </div>
            )}

            {ultima?.cintura_cm && (
              <div
                className="rounded-2xl p-5"
                style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--foreground-muted)" }}>CINTURA</p>
                <p className="text-3xl font-extrabold" style={{ color: "var(--orange)", letterSpacing: "-0.03em" }}>
                  {Number(ultima.cintura_cm).toFixed(1)}<span className="text-base font-normal ml-1">cm</span>
                </p>
                {deltaCintura && (
                  <p className="text-xs mt-1" style={{ color: deltaCintura.positivo ? "var(--red)" : "var(--green)" }}>
                    {deltaCintura.positivo ? "▲" : "▼"} {deltaCintura.valor} cm vs anterior
                  </p>
                )}
              </div>
            )}

            {ultima?.porcentaje_grasa && (
              <div
                className="rounded-2xl p-5"
                style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--foreground-muted)" }}>% GRASA</p>
                <p className="text-3xl font-extrabold" style={{ color: "var(--purple)", letterSpacing: "-0.03em" }}>
                  {Number(ultima.porcentaje_grasa).toFixed(1)}<span className="text-base font-normal ml-1">%</span>
                </p>
              </div>
            )}
          </div>

          {/* Gráficas de evolución */}
          <GraficaProgreso alumnoId={session.user.alumnoId} tieneGraficas={tieneGraficas} />

          {/* Historial en tabla */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
          >
            <div className="px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                Historial de mediciones ({mediciones.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Fecha","Peso (kg)","% Grasa","Cintura","Cadera","Pecho","Brazo","Pierna"].map((h) => (
                      <th key={h} className="py-3 px-4 text-left text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {mediciones.map((m) => (
                    <tr key={m.id} className="hover:bg-[var(--background-hover)] transition-colors">
                      <td className="py-3 px-4 font-medium" style={{ color: "var(--foreground)" }}>
                        {formatFechaCorta(m.fecha)}
                      </td>
                      {[m.peso_kg, m.porcentaje_grasa, m.cintura_cm, m.cadera_cm, m.pecho_cm, m.brazo_cm, m.pierna_cm].map((v, i) => (
                        <td key={i} className="py-3 px-4" style={{ color: v != null ? "var(--foreground)" : "var(--foreground-subtle)" }}>
                          {v != null ? Number(v).toFixed(1) : "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
