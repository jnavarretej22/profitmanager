import { Html, Head, Body, Container, Section, Heading, Text, Button, Hr } from "@react-email/components"

interface Props {
  nombre: string
  plan: string
  fechaVencimiento: string
}

export default function PlanActivado({ nombre, plan, fechaVencimiento }: Props) {
  const planLabel = plan === "inicial" ? "Plan Inicial" : "Plan Gratis"
  return (
    <Html lang="es">
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>ProFit Manager</Heading>
            <Text style={tagline}>✅ Pago confirmado</Text>
          </Section>
          <Section style={content}>
            <Heading style={h1}>¡Tu plan está activo, {nombre}!</Heading>
            <Text style={p}>
              Hemos confirmado tu pago. Tu suscripción al <strong>{planLabel}</strong> está activa
              hasta el <strong>{fechaVencimiento}</strong>.
            </Text>

            <Section style={successBox}>
              <Text style={successTitle}>¿Qué incluye tu plan?</Text>
              {plan === "inicial" && (
                <>
                  <Text style={featureItem}>✅ Hasta 10 alumnos activos</Text>
                  <Text style={featureItem}>✅ Templates de rutinas por objetivo</Text>
                  <Text style={featureItem}>✅ Google Meet automático en citas</Text>
                  <Text style={featureItem}>✅ Gráficas de progreso avanzadas</Text>
                  <Text style={featureItem}>✅ Exportación a PDF sin marca de agua</Text>
                </>
              )}
              {plan === "gratis" && (
                <>
                  <Text style={featureItem}>✅ Hasta 3 alumnos activos</Text>
                  <Text style={featureItem}>✅ Rutinas y planes alimenticios</Text>
                  <Text style={featureItem}>✅ Agenda de citas</Text>
                </>
              )}
            </Section>

            <Button style={button} href={`${process.env.NEXTAUTH_URL}/coach`}>
              Ir a mi dashboard
            </Button>

            <Hr style={hr} />
            <Text style={footer}>
              ¿Tienes alguna pregunta? Escríbenos a{" "}
              <a href="mailto:soporte@profitmanager.app" style={link}>soporte@profitmanager.app</a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const body = { backgroundColor: "#F9FAFB", fontFamily: "-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif" }
const container = { margin: "0 auto", padding: "20px 0 48px", maxWidth: "560px" }
const header = { backgroundColor: "#22C55E", borderRadius: "16px 16px 0 0", padding: "24px 32px" }
const logo = { color: "#FFFFFF", fontSize: "20px", fontWeight: "800", margin: "0", letterSpacing: "-0.02em" }
const tagline = { color: "rgba(255,255,255,0.85)", fontSize: "13px", margin: "4px 0 0" }
const content = { backgroundColor: "#FFFFFF", borderRadius: "0 0 16px 16px", padding: "32px", border: "1px solid #E5E7EB", borderTop: "none" }
const h1 = { color: "#111827", fontSize: "20px", fontWeight: "700", margin: "0 0 16px" }
const p = { color: "#374151", fontSize: "15px", lineHeight: "1.6", margin: "0 0 16px" }
const successBox = { backgroundColor: "#ECFDF3", borderRadius: "12px", padding: "16px 20px", margin: "4px 0 24px" }
const successTitle = { color: "#16A34A", fontSize: "14px", fontWeight: "700", margin: "0 0 10px" }
const featureItem = { color: "#374151", fontSize: "14px", margin: "0 0 6px" }
const button = { backgroundColor: "#22C55E", borderRadius: "10px", color: "#FFFFFF", fontWeight: "700", fontSize: "14px", padding: "12px 24px", textDecoration: "none" }
const hr = { borderColor: "#E5E7EB", margin: "24px 0 16px" }
const footer = { color: "#9CA3AF", fontSize: "13px", margin: "0" }
const link = { color: "#2D7DF6" }
