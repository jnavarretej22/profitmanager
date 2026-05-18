import { Html, Head, Body, Container, Section, Heading, Text, Button, Hr } from "@react-email/components"

interface Props {
  nombreCoach:       string
  nombreSolicitante: string
  emailSolicitante:  string
  telefonoSolicitante?: string | null
  mensaje?:          string | null
  linkSolicitudes:   string
}

export default function NuevaSolicitudCoach({
  nombreCoach, nombreSolicitante, emailSolicitante,
  telefonoSolicitante, mensaje, linkSolicitudes,
}: Props) {
  return (
    <Html lang="es">
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>ProFit Manager</Heading>
          </Section>
          <Section style={content}>
            <Heading style={h1}>Nueva solicitud de inscripción</Heading>
            <Text style={p}>
              Hola <strong>{nombreCoach}</strong>, tienes una nueva solicitud de un potencial alumno. Revísala y aprueba o rechaza desde tu dashboard.
            </Text>

            <Section style={dataBox}>
              <Text style={dataLabel}>Nombre</Text>
              <Text style={dataValue}>{nombreSolicitante}</Text>
              <Text style={dataLabel}>Email</Text>
              <Text style={dataValue}>{emailSolicitante}</Text>
              {telefonoSolicitante && <>
                <Text style={dataLabel}>Teléfono / WhatsApp</Text>
                <Text style={dataValue}>{telefonoSolicitante}</Text>
              </>}
              {mensaje && <>
                <Text style={dataLabel}>Mensaje</Text>
                <Text style={dataValue}>&ldquo;{mensaje}&rdquo;</Text>
              </>}
            </Section>

            <Button style={button} href={linkSolicitudes}>
              Ver solicitud en mi dashboard
            </Button>
            <Hr style={hr} />
            <Text style={footer}>
              ProFit Manager · <a href="mailto:soporte@profitmanager.app" style={link}>soporte@profitmanager.app</a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const body = { backgroundColor: "#F9FAFB", fontFamily: "-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif" }
const container = { margin: "0 auto", padding: "20px 0 48px", maxWidth: "560px" }
const header = { backgroundColor: "#2D7DF6", borderRadius: "16px 16px 0 0", padding: "24px 32px" }
const logo = { color: "#FFFFFF", fontSize: "20px", fontWeight: "800", margin: "0", letterSpacing: "-0.02em" }
const content = { backgroundColor: "#FFFFFF", borderRadius: "0 0 16px 16px", padding: "32px", border: "1px solid #E5E7EB", borderTop: "none" }
const h1 = { color: "#111827", fontSize: "20px", fontWeight: "700", margin: "0 0 16px" }
const p = { color: "#374151", fontSize: "15px", lineHeight: "1.6", margin: "0 0 20px" }
const dataBox = { backgroundColor: "#F9FAFB", borderRadius: "10px", padding: "16px 20px", border: "1px solid #E5E7EB", marginBottom: "24px" }
const dataLabel = { color: "#6B7280", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" as const, letterSpacing: "0.05em", margin: "0 0 2px" }
const dataValue = { color: "#111827", fontSize: "15px", margin: "0 0 12px" }
const button = { backgroundColor: "#2D7DF6", borderRadius: "10px", color: "#FFFFFF", fontWeight: "700", fontSize: "14px", padding: "12px 24px", textDecoration: "none" }
const hr = { borderColor: "#E5E7EB", margin: "24px 0 16px" }
const footer = { color: "#9CA3AF", fontSize: "13px", margin: "0" }
const link = { color: "#2D7DF6" }
