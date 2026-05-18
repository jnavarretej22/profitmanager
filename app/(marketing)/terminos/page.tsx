import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description: "Términos y condiciones del servicio ProFit Manager",
}

export default function TerminosPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--gray-50)" }}>
      <div className="max-w-3xl mx-auto px-5 py-12">
        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-sm font-semibold" style={{ color: "var(--blue)" }}>← Inicio</Link>
          <h1 className="text-3xl font-extrabold mt-4" style={{ color: "var(--gray-900)", letterSpacing: "-0.02em" }}>
            Términos y Condiciones
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--gray-500)" }}>
            Última actualización: 18 de mayo de 2026
          </p>
        </div>

        <div className="prose-content space-y-8" style={{ color: "var(--gray-700)", lineHeight: "1.7" }}>
          <Seccion titulo="1. Aceptación de los términos">
            Al acceder y utilizar la plataforma ProFit Manager (en adelante, &ldquo;la Plataforma&rdquo;), el usuario (en
            adelante, &ldquo;Coach&rdquo;) acepta estar sujeto a los presentes Términos y Condiciones. Si no acepta estos
            términos, no podrá utilizar la Plataforma.
          </Seccion>

          <Seccion titulo="2. Descripción del servicio">
            ProFit Manager es una plataforma SaaS (Software as a Service) diseñada para coaches físicos que
            desean gestionar a sus alumnos, crear rutinas, planes alimenticios, agendar citas y hacer
            seguimiento del progreso. El servicio está dirigido principalmente al mercado hispanohablante de
            Latinoamérica.
          </Seccion>

          <Seccion titulo="3. Registro y cuenta">
            <p>3.1. El Coach debe registrarse con información veraz, completa y actualizada.</p>
            <p>3.2. El Coach es responsable de mantener la confidencialidad de sus credenciales de acceso.</p>
            <p>3.3. El Coach es responsable de todas las actividades que ocurran bajo su cuenta.</p>
            <p>3.4. Los alumnos son registrados por el Coach y no realizan pagos a ProFit Manager.</p>
          </Seccion>

          <Seccion titulo="4. Planes y pagos">
            <p>4.1. ProFit Manager ofrece un plan Gratis (sin costo) y un plan Inicial ($15 USD/mes o $144 USD/año).</p>
            <p>4.2. Los pagos del plan Inicial se realizan por transferencia bancaria manual. ProFit Manager no
               procesa pagos automáticos con tarjeta de crédito en el MVP.</p>
            <p>4.3. Una vez confirmado el pago por el equipo de ProFit Manager, el plan se activa dentro de las
               24 horas hábiles siguientes.</p>
            <p>4.4. No se realizan reembolsos por períodos no utilizados.</p>
            <p>4.5. Al vencer el plan, el Coach entra en un período de gracia de 3 días con acceso completo.
               Tras ese período, la cuenta pasa a modo solo lectura.</p>
          </Seccion>

          <Seccion titulo="5. Datos de los alumnos">
            <p>5.1. El Coach es responsable de obtener el consentimiento informado de sus alumnos para el
               tratamiento de sus datos personales y de salud antes de registrarlos en la Plataforma.</p>
            <p>5.2. ProFit Manager actúa como encargado del tratamiento de los datos de los alumnos del Coach.
               El Coach es el responsable del tratamiento.</p>
            <p>5.3. Los datos de los alumnos nunca se comparten con terceros ni se utilizan para entrenar
               modelos de inteligencia artificial.</p>
          </Seccion>

          <Seccion titulo="6. Propiedad intelectual">
            ProFit Manager y todos sus contenidos, características y funcionalidades son propiedad de
            ProFit Manager S.A.S. y están protegidos por las leyes de propiedad intelectual aplicables.
            El Coach conserva la propiedad de los datos que ingresa en la Plataforma (rutinas, planes,
            información de alumnos).
          </Seccion>

          <Seccion titulo="7. Limitación de responsabilidad">
            ProFit Manager no es responsable por decisiones de entrenamiento o nutricionales tomadas por
            el Coach o sus alumnos. La Plataforma es una herramienta de gestión, no sustituye el criterio
            profesional del Coach ni la asesoría médica.
          </Seccion>

          <Seccion titulo="8. Terminación">
            <p>8.1. El Coach puede eliminar su cuenta en cualquier momento contactando a soporte.</p>
            <p>8.2. ProFit Manager puede suspender cuentas que violen estos Términos.</p>
            <p>8.3. Ante solicitud de eliminación, se realizará hard-delete de los datos del Coach y sus
               alumnos dentro de los 30 días siguientes (derecho al olvido, LOPDP).</p>
          </Seccion>

          <Seccion titulo="9. Ley aplicable">
            Estos Términos se rigen por las leyes de la República del Ecuador. Cualquier disputa será
            resuelta ante los tribunales competentes de la ciudad de Quito, Ecuador.
          </Seccion>

          <Seccion titulo="10. Contacto">
            Para consultas sobre estos Términos, contacta a:
            <a href="mailto:legal@profitmanager.app" style={{ color: "var(--blue)", marginLeft: "4px" }}>
              legal@profitmanager.app
            </a>
          </Seccion>
        </div>
      </div>
    </div>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-bold mb-3" style={{ color: "var(--gray-900)" }}>{titulo}</h2>
      <div className="text-sm space-y-2">{children}</div>
    </div>
  )
}
