import { Html, Head, Body, Container, Section, Heading, Text, Button, Hr } from "@react-email/components"

interface Props {
  nombreAlumno:    string
  nombreCoach:     string
  email:           string
  passwordTemporal:string
  linkDashboard:   string
}

export default function BienvenidaAlumno({
  nombreAlumno, nombreCoach, email, passwordTemporal, linkDashboard,
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
            <Heading style={h1}>¡Bienvenido, {nombreAlumno}!</Heading>
            <Text style={p}>
              El coach <strong>{nombreCoach}</strong> ha aceptado tu solicitud. Tu cuenta está lista. Usa las credenciales a continuación para iniciar sesión:
            </Text>

            <Section style={credBox}>
              <Text style={credLabel}>Correo electrónico</Text>
              <Text style={credValue}>{email}</Text>
              <Text style={credLabel}>Contraseña temporal</Text>
              <Text style={credPassword}>{passwordTemporal}</Text>
            </Section>

            <Section style={warningBox}>
              <Text style={warningText}>
                🔒 Por seguridad, te recomendamos cambiar tu contraseña al ingresar por primera vez desde tu perfil.
              </Text>
            </Section>

            <Button style={button} href={linkDashboard}>
              Ingresar a mi dashboard
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
const header = { backgroundColor: "#22C55E", borderRadius: "16px 16px 0 0", padding: "24px 32px" }
const logo = { color: "#FFFFFF", fontSize: "20px", fontWeight: "800", margin: "0", letterSpacing: "-0.02em" }
const content = { backgroundColor: "#FFFFFF", borderRadius: "0 0 16px 16px", padding: "32px", border: "1px solid #E5E7EB", borderTop: "none" }
const h1 = { color: "#111827", fontSize: "20px", fontWeight: "700", margin: "0 0 16px" }
const p = { color: "#374151", fontSize: "15px", lineHeight: "1.6", margin: "0 0 20px" }
const credBox = { backgroundColor: "#F0FDF4", borderRadius: "10px", padding: "16px 20px", border: "1px solid #BBF7D0", marginBottom: "20px" }
const credLabel = { color: "#6B7280", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" as const, letterSpacing: "0.05em", margin: "0 0 2px" }
const credValue = { color: "#111827", fontSize: "15px", margin: "0 0 12px", fontFamily: "monospace" }
const credPassword = { fontSize: "18px", fontWeight: "700", color: "#16a34a", letterSpacing: "0.05em" }
const warningBox = { backgroundColor: "#FFF4EC", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px" }
const warningText = { color: "#F97316", fontSize: "13px", margin: "0" }
const button = { backgroundColor: "#22C55E", borderRadius: "10px", color: "#FFFFFF", fontWeight: "700", fontSize: "14px", padding: "12px 24px", textDecoration: "none" }
const hr = { borderColor: "#E5E7EB", margin: "24px 0 16px" }
const footer = { color: "#9CA3AF", fontSize: "13px", margin: "0" }
const link = { color: "#2D7DF6" }
