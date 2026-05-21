import { Html, Head, Body, Container, Section, Heading, Text, Button, Hr } from "@react-email/components"

interface Props {
  nombreAlumno:  string
  nombreCoach:   string
  email:         string
  linkLogin:     string
}

export default function BienvenidaAlumno({
  nombreAlumno, nombreCoach, email, linkLogin,
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
              El coach <strong>{nombreCoach}</strong> creó tu cuenta en ProFit Manager. Ya puedes acceder a tu rutina, plan alimenticio y progreso desde un solo lugar.
            </Text>

            <Section style={pasoBox}>
              <Text style={pasoTitulo}>Activa tu cuenta en 3 pasos</Text>
              <Text style={pasoItem}>1. Ingresa al enlace de abajo</Text>
              <Text style={pasoItem}>2. Escribe tu correo: <strong>{email}</strong></Text>
              <Text style={pasoItem}>3. Crea tu propia contraseña — solo tú la sabrás</Text>
            </Section>

            <Button style={button} href={linkLogin}>
              Activar mi cuenta
            </Button>

            <Text style={pAlt}>
              También puedes copiar este enlace en tu navegador: <br />
              <a href={linkLogin} style={link}>{linkLogin}</a>
            </Text>

            <Hr style={hr} />
            <Text style={footer}>
              ¿Tienes dudas? Escríbele a tu coach o a <a href="mailto:soporte@profitmanager.app" style={link}>soporte@profitmanager.app</a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const body       = { backgroundColor: "#F9FAFB", fontFamily: "-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif" }
const container  = { margin: "0 auto", padding: "20px 0 48px", maxWidth: "560px" }
const header     = { backgroundColor: "#22C55E", borderRadius: "16px 16px 0 0", padding: "24px 32px" }
const logo       = { color: "#FFFFFF", fontSize: "20px", fontWeight: "800", margin: "0", letterSpacing: "-0.02em" }
const content    = { backgroundColor: "#FFFFFF", borderRadius: "0 0 16px 16px", padding: "32px", border: "1px solid #E5E7EB", borderTop: "none" }
const h1         = { color: "#111827", fontSize: "20px", fontWeight: "700", margin: "0 0 16px" }
const p          = { color: "#374151", fontSize: "15px", lineHeight: "1.6", margin: "0 0 20px" }
const pasoBox    = { backgroundColor: "#F0FDF4", borderRadius: "10px", padding: "18px 20px", border: "1px solid #BBF7D0", marginBottom: "24px" }
const pasoTitulo = { color: "#15803d", fontSize: "12px", fontWeight: "700", textTransform: "uppercase" as const, letterSpacing: "0.05em", margin: "0 0 10px" }
const pasoItem   = { color: "#111827", fontSize: "14px", margin: "0 0 6px", lineHeight: "1.5" }
const button     = { backgroundColor: "#22C55E", borderRadius: "10px", color: "#FFFFFF", fontWeight: "700", fontSize: "14px", padding: "12px 24px", textDecoration: "none", display: "inline-block" }
const pAlt       = { color: "#6B7280", fontSize: "12px", lineHeight: "1.5", margin: "20px 0 0", wordBreak: "break-all" as const }
const hr         = { borderColor: "#E5E7EB", margin: "24px 0 16px" }
const footer     = { color: "#9CA3AF", fontSize: "13px", margin: "0", lineHeight: "1.5" }
const link       = { color: "#2D7DF6" }
