import { Html, Head, Body, Container, Section, Heading, Text, Hr } from "@react-email/components"

interface Props {
  nombreSolicitante: string
  nombreCoach:       string
}

export default function SolicitudRecibida({ nombreSolicitante, nombreCoach }: Props) {
  return (
    <Html lang="es">
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>ProFit Manager</Heading>
          </Section>
          <Section style={content}>
            <Heading style={h1}>¡Solicitud enviada con éxito!</Heading>
            <Text style={p}>
              Hola <strong>{nombreSolicitante}</strong>, tu solicitud para unirte al equipo del coach <strong>{nombreCoach}</strong> fue recibida correctamente.
            </Text>
            <Section style={infoBox}>
              <Text style={infoText}>
                📋 El coach revisará tu información y te contactará pronto. Asegúrate de revisar tu bandeja de entrada (y la carpeta de spam) para las próximas notificaciones.
              </Text>
            </Section>
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
const infoBox = { backgroundColor: "#EFF5FF", borderRadius: "10px", padding: "14px 16px" }
const infoText = { color: "#1F66D9", fontSize: "14px", margin: "0" }
const hr = { borderColor: "#E5E7EB", margin: "24px 0 16px" }
const footer = { color: "#9CA3AF", fontSize: "13px", margin: "0" }
const link = { color: "#2D7DF6" }
