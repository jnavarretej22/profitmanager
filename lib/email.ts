import { Resend } from "resend"
import { render } from "@react-email/render"

// Instanciación lazy para evitar error en build si RESEND_API_KEY está vacía
let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? "placeholder")
  return _resend
}

const FROM = process.env.EMAIL_FROM ?? "ProFit Manager <noreply@profitmanager.app>"

export type EmailTemplate =
  | { tipo: "bienvenida-coach";         data: { nombre: string; email: string } }
  | { tipo: "verificacion-email";       data: { nombre: string; linkVerificacion: string } }
  | { tipo: "reset-contrasena";         data: { nombre: string; linkReset: string } }
  | { tipo: "bienvenida-alumno";        data: { nombreAlumno: string; nombreCoach: string; email: string; passwordTemporal: string; linkDashboard: string } }
  | { tipo: "vencimiento-aviso";        data: { nombre: string; diasRestantes: number; fechaVencimiento: string } }
  | { tipo: "plan-activado";            data: { nombre: string; plan: string; fechaVencimiento: string } }
  | { tipo: "recordatorio-cita";        data: { nombre: string; titulo: string; fecha: string; hora: string; meetLink?: string } }
  | { tipo: "solicitud-recibida";       data: { nombreSolicitante: string; nombreCoach: string } }
  | { tipo: "nueva-solicitud-coach";    data: { nombreCoach: string; nombreSolicitante: string; emailSolicitante: string; telefonoSolicitante?: string | null; mensaje?: string | null; linkSolicitudes: string } }
  | { tipo: "solicitud-rechazada";      data: { nombreSolicitante: string; nombreCoach: string } }

async function obtenerTemplate(template: EmailTemplate): Promise<{ subject: string; html: string }> {
  // Importación dinámica para no bloquear el bundle principal
  const mod = await import(`@/emails/${template.tipo}`)
  const ComponenteEmail = mod.default
  const html = await render(ComponenteEmail(template.data))

  const subjects: Record<EmailTemplate["tipo"], string> = {
    "bienvenida-coach":       "¡Bienvenido a ProFit Manager!",
    "verificacion-email":     "Verifica tu correo electrónico",
    "reset-contrasena":       "Restablecer tu contraseña",
    "bienvenida-alumno":      "¡Tu solicitud fue aprobada! Aquí están tus credenciales",
    "vencimiento-aviso":      `Tu plan vence en ${(template.data as { diasRestantes: number }).diasRestantes} día(s)`,
    "plan-activado":          "¡Tu plan está activo!",
    "recordatorio-cita":      "Recordatorio: tienes una cita próxima",
    "solicitud-recibida":     "Solicitud de inscripción recibida",
    "nueva-solicitud-coach":  "Nueva solicitud de inscripción",
    "solicitud-rechazada":    "Actualización sobre tu solicitud",
  }

  return { subject: subjects[template.tipo], html }
}

export async function enviarEmail(
  to: string,
  template: EmailTemplate
): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY no configurada — email no enviado:", template.tipo)
    return { ok: true } // No falla en dev sin configurar
  }

  try {
    const { subject, html } = await obtenerTemplate(template)
    const { error } = await getResend().emails.send({ from: FROM, to, subject, html })
    if (error) {
      console.error("[email] Error Resend:", error)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (err) {
    console.error("[email] Error al enviar:", err)
    return { ok: false, error: String(err) }
  }
}

// Nunca enviar emails durante el período de gracia silencioso (solo notificaciones in-app)
export function enPeriodoGracia(fechaVencimiento: Date | null): boolean {
  if (!fechaVencimiento) return false
  const ahora = new Date()
  const vencimiento = new Date(fechaVencimiento)
  const graciaMs = 3 * 24 * 60 * 60 * 1000
  return ahora > vencimiento && ahora <= new Date(vencimiento.getTime() + graciaMs)
}
