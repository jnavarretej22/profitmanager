import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { CreditCard, ChevronLeft, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui"
import { RegistrarPagoModal } from "../RegistrarPagoModal"

export default async function AdminPagosPage() {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/login")

  const pagos = await prisma.pago.findMany({
    include: {
      coach: { include: { user: { select: { nombre: true, apellido: true, email: true } } } },
      registrador: { select: { nombre: true, apellido: true } },
    },
    orderBy: { fecha_pago: "desc" },
  })

  const coaches = await prisma.coach.findMany({
    include: { user: { select: { nombre: true, apellido: true, email: true } } },
    orderBy: { user: { nombre: "asc" } },
  })

  const totalPagos = pagos.reduce((s, p) => s + Number(p.monto), 0)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="section-title">Pagos</h1>
          <p className="section-subtitle">
            Historial completo de pagos registrados ·{" "}
            <span className="font-bold" style={{ color: "var(--green)" }}>
              ${totalPagos.toFixed(2)} USD total
            </span>
          </p>
        </div>
        <RegistrarPagoModal coaches={coaches.map((c) => ({ id: c.id, nombre: `${c.user.nombre} ${c.user.apellido}`, email: c.user.email }))} />
      </div>

      {/* Tabla de pagos */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        {pagos.length === 0 ? (
          <div className="py-12 text-center">
            <CreditCard size={32} className="mx-auto mb-3" style={{ color: "var(--foreground-subtle)" }} />
            <p className="font-semibold" style={{ color: "var(--foreground)" }}>Sin pagos registrados</p>
            <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
              Registra el primer pago con el botón de arriba.
            </p>
          </div>
        ) : (
        <>
          {/* Vista mobile (<md): cards verticales */}
          <ul className="md:hidden divide-y" style={{ borderColor: "var(--border)" }}>
            {pagos.map((p) => (
              <li key={p.id} className="p-4">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <Link
                    href={`/admin/coaches/${p.coach_id}`}
                    className="font-semibold text-sm truncate hover:underline"
                    style={{ color: "var(--blue)" }}
                  >
                    {p.coach.user.nombre} {p.coach.user.apellido}
                  </Link>
                  <span className="font-bold text-sm flex-shrink-0" style={{ color: "var(--green)" }}>
                    ${Number(p.monto).toFixed(2)}
                  </span>
                </div>
                <p className="text-[11px] truncate mb-2" style={{ color: "var(--foreground-subtle)" }}>
                  {p.coach.user.email}
                </p>
                <div className="flex items-center gap-2 flex-wrap text-[11px]" style={{ color: "var(--foreground-muted)" }}>
                  <Badge variant="neutral">{p.metodo}</Badge>
                  <span>{new Date(p.fecha_pago).toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <span>·</span>
                  <span>
                    {new Date(p.periodo_desde).toLocaleDateString("es-EC", { day: "numeric", month: "short" })}
                    {" → "}
                    {new Date(p.periodo_hasta).toLocaleDateString("es-EC", { day: "numeric", month: "short" })}
                  </span>
                  {p.comprobante_url && (
                    <a
                      href={p.comprobante_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 font-semibold"
                      style={{ color: "var(--blue)" }}
                    >
                      <ExternalLink size={11} /> Comprobante
                    </a>
                  )}
                </div>
                {p.registrador && (
                  <p className="text-[10px] mt-1.5" style={{ color: "var(--foreground-subtle)" }}>
                    Registrado por {p.registrador.nombre} {p.registrador.apellido}
                  </p>
                )}
              </li>
            ))}
          </ul>

          {/* Vista desktop (≥md): tabla */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Coach", "Monto", "Método", "Período", "Fecha pago", "Comprobante", "Registrado por"].map((h) => (
                    <th key={h} className="py-3 px-5 text-left text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {pagos.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--background-hover)] transition-colors">
                    <td className="py-3 px-5">
                      <Link
                        href={`/admin/coaches/${p.coach_id}`}
                        className="font-semibold hover:underline"
                        style={{ color: "var(--blue)" }}
                      >
                        {p.coach.user.nombre} {p.coach.user.apellido}
                      </Link>
                      <p className="text-xs" style={{ color: "var(--foreground-subtle)" }}>{p.coach.user.email}</p>
                    </td>
                    <td className="py-3 px-5 font-bold" style={{ color: "var(--green)" }}>
                      ${Number(p.monto).toFixed(2)} {p.moneda}
                    </td>
                    <td className="py-3 px-5">
                      <Badge variant="neutral">{p.metodo}</Badge>
                    </td>
                    <td className="py-3 px-5 text-xs" style={{ color: "var(--foreground-muted)" }}>
                      {new Date(p.periodo_desde).toLocaleDateString("es-EC")}
                      {" → "}
                      {new Date(p.periodo_hasta).toLocaleDateString("es-EC")}
                    </td>
                    <td className="py-3 px-5 text-xs" style={{ color: "var(--foreground-muted)" }}>
                      {new Date(p.fecha_pago).toLocaleDateString("es-EC")}
                    </td>
                    <td className="py-3 px-5">
                      {p.comprobante_url ? (
                        <a
                          href={p.comprobante_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-semibold"
                          style={{ color: "var(--blue)" }}
                        >
                          <ExternalLink size={12} /> Ver
                        </a>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--foreground-subtle)" }}>—</span>
                      )}
                    </td>
                    <td className="py-3 px-5 text-xs" style={{ color: "var(--foreground-muted)" }}>
                      {p.registrador ? `${p.registrador.nombre} ${p.registrador.apellido}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
        )}
      </div>
    </div>
  )
}
