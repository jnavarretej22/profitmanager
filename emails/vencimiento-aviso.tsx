import { Html, Head, Body, Container, Section, Heading, Text, Button, Hr } from "@react-email/components"

interface Props {
  nombre: string
  diasRestantes: number
  fechaVencimiento: string
}

export default function VencimientoAviso({ nombre, diasRestantes, fechaVencimiento }: Props) {
  const urgente = diasRestantes <= 3
  const color = urgente ? "#EF4444" : "#F97316"
  const bgColor = urgente ? "#FEF2F2" : "#FFF4EC"

  return (
    <Html lang="es">
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section style={{ ...header, backgroundColor: color }}>
            <Heading style={logo}>ProFit Manager</Heading>
            <Text style={tagline}>{urgente ? "⚠️ Acción requerida" : "📅 Aviso de vencimiento"}</Text>
          </Section>
          <Section style={content}>
            <Heading style={h1}>
              {urgente
                ? `Tu plan vence en ${diasRestantes} día${diasRestantes === 1 ? "" : "s"}`
                : `Renueva tu plan pronto`}
            </Heading>
            <Text style={p}>Hola {nombre},</Text>
            <Text style={p}>
              Tu suscripción a ProFit Manager vence el{" "}
              <strong>{fechaVencimiento}</strong>
              {diasRestantes > 0
                ? `, en ${diasRestantes} día${diasRestantes === 1 ? "" : "s"}.`
                : " (hoy)."}
            </Text>

            <Section style={{ ...alertBox, backgroundColor: bgColor, borderColor: color }}>
              <Text style={{ ...alertText, color }}>
                {urgente
                  ? "Para evitar perder acceso a tus datos, renueva tu plan antes de la fecha de vencimiento."
                  : "Recuerda transferir el pago y enviar el comprobante para mantener tu acceso completo."}
              </Text>
            </Section>

            <Text style={p}>Para renovar, contáctanos por WhatsApp o escríbenos a soporte:</Text>
            <Button style={{ ...button, backgroundColor: color }} href={`${process.env.NEXTAUTH_URL}/coach/mi-plan`}>
              Ver opciones de renovación
            </Button>

            <Hr style={hr} />
            <Text style={footer}>ProFit Manager · <a href="mailto:soporte@profitmanager.app" style={link}>soporte@profitmanager.app</a></Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const body = { backgroundColor: "#F9FAFB", fontFamily: "-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif" }
const container = { margin: "0 auto", padding: "20px 0 48px", maxWidth: "560px" }
const header = { borderRadius: "16px 16px 0 0", padding: "24px 32px" }
const logo = { color: "#FFFFFF", fontSize: "20px", fontWeight: "800", margin: "0", letterSpacing: "-0.02em" }
const tagline = { color: "rgba(255,255,255,0.85)", fontSize: "13px", margin: "4px 0 0" }
const content = { backgroundColor: "#FFFFFF", borderRadius: "0 0 16px 16px", padding: "32px", border: "1px solid #E5E7EB", borderTop: "none" }
const h1 = { color: "#111827", fontSize: "20px", fontWeight: "700", margin: "0 0 16px" }
const p = { color: "#374151", fontSize: "15px", lineHeight: "1.6", margin: "0 0 12px" }
const alertBox = { borderRadius: "10px", padding: "14px 18px", border: "1px solid", margin: "8px 0 20px" }
const alertText = { fontSize: "14px", margin: "0", lineHeight: "1.5" }
const button = { borderRadius: "10px", color: "#FFFFFF", fontWeight: "700", fontSize: "14px", padding: "12px 24px", textDecoration: "none" }
const hr = { borderColor: "#E5E7EB", margin: "24px 0 16px" }
const footer = { color: "#9CA3AF", fontSize: "13px", margin: "0" }
const link = { color: "#2D7DF6" }
