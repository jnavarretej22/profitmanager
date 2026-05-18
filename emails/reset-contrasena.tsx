import { Html, Head, Body, Container, Section, Heading, Text, Button, Hr } from "@react-email/components"

interface Props {
  nombre: string
  linkReset: string
}

export default function ResetContrasena({ nombre, linkReset }: Props) {
  return (
    <Html lang="es">
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>ProFit Manager</Heading>
          </Section>
          <Section style={content}>
            <Heading style={h1}>Restablecer contraseña</Heading>
            <Text style={p}>
              Hola {nombre}, recibimos una solicitud para restablecer la contraseña de tu cuenta.
              Haz clic en el botón para crear una nueva:
            </Text>
            <Button style={button} href={linkReset}>Restablecer contraseña</Button>
            <Section style={warningBox}>
              <Text style={warningText}>
                ⚠️ Este enlace expira en <strong>1 hora</strong>. Si no solicitaste este cambio, ignora este correo — tu cuenta sigue segura.
              </Text>
            </Section>
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
const header = { backgroundColor: "#2D7DF6", borderRadius: "16px 16px 0 0", padding: "24px 32px" }
const logo = { color: "#FFFFFF", fontSize: "20px", fontWeight: "800", margin: "0", letterSpacing: "-0.02em" }
const content = { backgroundColor: "#FFFFFF", borderRadius: "0 0 16px 16px", padding: "32px", border: "1px solid #E5E7EB", borderTop: "none" }
const h1 = { color: "#111827", fontSize: "20px", fontWeight: "700", margin: "0 0 16px" }
const p = { color: "#374151", fontSize: "15px", lineHeight: "1.6", margin: "0 0 20px" }
const button = { backgroundColor: "#EF4444", borderRadius: "10px", color: "#FFFFFF", fontWeight: "700", fontSize: "14px", padding: "12px 24px", textDecoration: "none" }
const warningBox = { backgroundColor: "#FFF4EC", borderRadius: "10px", padding: "12px 16px", marginTop: "20px" }
const warningText = { color: "#F97316", fontSize: "13px", margin: "0" }
const hr = { borderColor: "#E5E7EB", margin: "24px 0 16px" }
const footer = { color: "#9CA3AF", fontSize: "13px", margin: "0" }
const link = { color: "#2D7DF6" }
