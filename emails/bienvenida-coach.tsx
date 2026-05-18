import {
  Html, Head, Body, Container, Section, Heading, Text, Button, Hr, Img,
} from "@react-email/components"

interface Props {
  nombre: string
  email: string
}

export default function BienvenidaCoach({ nombre, email }: Props) {
  return (
    <Html lang="es">
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>ProFit Manager</Heading>
            <Text style={tagline}>La plataforma para coaches de alto rendimiento</Text>
          </Section>

          <Section style={content}>
            <Heading style={h1}>¡Bienvenido, {nombre}! 🎉</Heading>
            <Text style={p}>
              Tu cuenta de coach ha sido creada exitosamente. Ya puedes empezar a gestionar
              a tus alumnos, asignar rutinas y planes alimenticios, y agendar citas.
            </Text>

            <Section style={infoBox}>
              <Text style={infoText}>Tu correo registrado: <strong>{email}</strong></Text>
            </Section>

            <Text style={p}>Para comenzar, ingresa a tu dashboard:</Text>

            <Button style={button} href={`${process.env.NEXTAUTH_URL}/coach`}>
              Ir a mi dashboard
            </Button>

            <Hr style={hr} />

            <Text style={footer}>
              ¿Tienes dudas? Escríbenos a{" "}
              <a href="mailto:soporte@profitmanager.app" style={link}>
                soporte@profitmanager.app
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const body = { backgroundColor: "#F9FAFB", fontFamily: "-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif" }
const container = { margin: "0 auto", padding: "20px 0 48px", maxWidth: "560px" }
const header = { backgroundColor: "#2D7DF6", borderRadius: "16px 16px 0 0", padding: "28px 32px" }
const logo = { color: "#FFFFFF", fontSize: "22px", fontWeight: "800", margin: "0", letterSpacing: "-0.02em" }
const tagline = { color: "rgba(255,255,255,0.8)", fontSize: "13px", margin: "4px 0 0" }
const content = { backgroundColor: "#FFFFFF", borderRadius: "0 0 16px 16px", padding: "32px", border: "1px solid #E5E7EB", borderTop: "none" }
const h1 = { color: "#111827", fontSize: "20px", fontWeight: "700", margin: "0 0 16px", letterSpacing: "-0.01em" }
const p = { color: "#374151", fontSize: "15px", lineHeight: "1.6", margin: "0 0 16px" }
const infoBox = { backgroundColor: "#EFF5FF", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px" }
const infoText = { color: "#1F66D9", fontSize: "14px", margin: "0" }
const button = { backgroundColor: "#2D7DF6", borderRadius: "10px", color: "#FFFFFF", fontWeight: "700", fontSize: "14px", padding: "12px 24px", textDecoration: "none", display: "inline-block" }
const hr = { borderColor: "#E5E7EB", margin: "24px 0 16px" }
const footer = { color: "#9CA3AF", fontSize: "13px", margin: "0" }
const link = { color: "#2D7DF6" }
