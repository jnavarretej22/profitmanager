import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Política de privacidad y tratamiento de datos personales de ProFit Manager",
}

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <div className="max-w-3xl mx-auto px-5 py-12">
        <div className="mb-10">
          <Link href="/" className="text-sm font-semibold" style={{ color: "var(--blue)" }}>← Inicio</Link>
          <h1 className="text-3xl font-extrabold mt-4" style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}>
            Política de Privacidad
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--foreground-muted)" }}>
            Última actualización: 18 de mayo de 2026 · Cumple con LOPDP Ecuador
          </p>
        </div>

        <div className="space-y-8 text-sm" style={{ color: "var(--foreground-secondary)", lineHeight: "1.7" }}>
          <Seccion titulo="1. Responsable del tratamiento">
            <p><strong>ProFit Manager S.A.S.</strong></p>
            <p>RUC: 1792345678001</p>
            <p>Quito, Ecuador</p>
            <p>Email: <a href="mailto:privacidad@profitmanager.app" style={{ color: "var(--blue)" }}>privacidad@profitmanager.app</a></p>
          </Seccion>

          <Seccion titulo="2. Datos que recopilamos">
            <p><strong>Coaches:</strong> nombre, apellido, email, teléfono, país, zona horaria, logo, especialidad.</p>
            <p><strong>Alumnos (registrados por el Coach):</strong> nombre, email, cédula/DNI, fecha de nacimiento,
               género, altura, peso, objetivo, medidas corporales, notas médicas, fotos de progreso.</p>
            <p><strong>Uso de la plataforma:</strong> logs de acceso, acciones realizadas (auditoría).</p>
            <p><strong>Pagos:</strong> fecha, monto, método de pago, comprobante. No almacenamos datos de tarjetas.</p>
          </Seccion>

          <Seccion titulo="3. Datos de salud (categoría especial)">
            Los datos de mediciones corporales y notas médicas de los alumnos son datos de categoría especial
            según la LOPDP Ecuador. Estos datos:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Se almacenan cifrados en reposo (AES-256).</li>
              <li>Solo son accesibles para el Coach responsable del alumno y los administradores de ProFit Manager
                  con propósito de soporte técnico auditado.</li>
              <li>Requieren consentimiento expreso del alumno, obtenido por el Coach antes del registro.</li>
              <li>Nunca se comparten con terceros ni se usan para entrenar modelos de IA.</li>
            </ul>
          </Seccion>

          <Seccion titulo="4. Finalidad del tratamiento">
            <ul className="list-disc pl-5 space-y-1">
              <li>Proveer las funcionalidades de la plataforma (gestión de alumnos, rutinas, agenda).</li>
              <li>Enviar notificaciones transaccionales (vencimiento de plan, recordatorio de cita).</li>
              <li>Gestionar la relación comercial con el Coach (facturación, soporte).</li>
              <li>Mejorar la Plataforma mediante análisis agregados y anónimos.</li>
            </ul>
          </Seccion>

          <Seccion titulo="5. Base legal">
            El tratamiento se basa en: (a) ejecución del contrato de servicio entre ProFit Manager y el Coach;
            (b) consentimiento del alumno otorgado al Coach para el tratamiento de sus datos de salud;
            (c) interés legítimo para el funcionamiento seguro de la plataforma.
          </Seccion>

          <Seccion titulo="6. Transferencias internacionales">
            Los datos pueden ser procesados en servidores ubicados en Estados Unidos (Vercel, Neon Serverless
            Postgres). Estas transferencias se realizan bajo garantías adecuadas (cláusulas contractuales
            estándar) conforme a la LOPDP.
          </Seccion>

          <Seccion titulo="7. Plazo de conservación">
            Los datos se conservan durante la vigencia de la cuenta y hasta 2 años después de su eliminación
            para cumplir obligaciones legales (excepto ante solicitud de derecho al olvido, donde se realiza
            eliminación definitiva en 30 días).
          </Seccion>

          <Seccion titulo="8. Derechos del titular">
            Conforme a la LOPDP Ecuador, el Coach y sus alumnos tienen derecho a:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Acceso:</strong> conocer qué datos tratamos sobre usted.</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos.</li>
              <li><strong>Eliminación (derecho al olvido):</strong> solicitar borrado definitivo de sus datos.</li>
              <li><strong>Portabilidad:</strong> exportar sus datos en formato estructurado (CSV/PDF).</li>
              <li><strong>Oposición:</strong> oponerse a ciertos usos de sus datos.</li>
            </ul>
            <p className="mt-2">Para ejercer estos derechos, contacta a:{" "}
              <a href="mailto:privacidad@profitmanager.app" style={{ color: "var(--blue)" }}>
                privacidad@profitmanager.app
              </a>
            </p>
          </Seccion>

          <Seccion titulo="9. Cookies">
            La Plataforma usa cookies de sesión (estrictamente necesarias para la autenticación). No usamos
            cookies de publicidad ni de seguimiento de terceros.
          </Seccion>

          <Seccion titulo="10. Cambios en esta política">
            Notificaremos cambios materiales a esta Política por email con 15 días de anticipación. El uso
            continuado de la Plataforma tras esa fecha implica aceptación.
          </Seccion>

          <Seccion titulo="11. Autoridad de control">
            En Ecuador, la autoridad competente en protección de datos es la
            <strong> Superintendencia de Protección de Datos Personales</strong> (cuando entre en plena operación).
          </Seccion>
        </div>
      </div>
    </div>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-bold mb-3" style={{ color: "var(--foreground)" }}>{titulo}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  )
}
