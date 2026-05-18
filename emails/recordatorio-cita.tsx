import { Html, Head, Body, Container, Section, Heading, Text, Button, Hr } from "@react-email/components"

interface Props {
  nombre: string
  titulo: string
  fecha: string
  hora: string
  meetLink?: string
}

export default function RecordatorioCita({ nombre, titulo, fecha, hora, meetLink }: Props) {
  return (
    <Html lang="es">
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>ProFit Manager</Heading>
            <Text style={tagline}>📅 Recordatorio de cita</Text>
          </Section>
          <Section style={content}>
            <Heading style={h1}>Tienes una cita mañana</Heading>
            <Text style={p}>Hola {nombre}, te recordamos que tienes una sesión programada:</Text>

            <Section style={citaBox}>
              <Text style={citaTitulo}>{titulo}</Text>
              <Text style={citaDetalle}>📅 {fecha}</Text>
              <Text style={citaDetalle}>🕐 {hora}</Text>
              {meetLink && <Text style={citaDetalle}>🔗 Sesión online</Text>}
            </Section>

            {meetLink && (
              <>
                <Text style={p}>Únete a la videollamada con el botón de abajo:</Text>
                <Button style={button} href={meetLink}>Unirse a la videollamada</Button>
              </>
            )}

            {!meetLink && (
              <Text style={p}>Recuerda acudir al lugar acordado con tu entrenador a la hora indicada.</Text>
            )}

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
const tagline = { color: "rgba(255,255,255,0.85)", fontSize: "13px", margin: "4px 0 0" }
const content = { backgroundColor: "#FFFFFF", borderRadius: "0 0 16px 16px", padding: "32px", border: "1px solid #E5E7EB", borderTop: "none" }
const h1 = { color: "#111827", fontSize: "20px", fontWeight: "700", margin: "0 0 16px" }
const p = { color: "#374151", fontSize: "15px", lineHeight: "1.6", margin: "0 0 16px" }
const citaBox = { backgroundColor: "#EFF5FF", borderRadius: "12px", padding: "20px 24px", margin: "4px 0 20px" }
const citaTitulo = { color: "#1F66D9", fontSize: "16px", fontWeight: "700", margin: "0 0 12px" }
const citaDetalle = { color: "#374151", fontSize: "14px", margin: "0 0 6px" }
const button = { backgroundColor: "#2D7DF6", borderRadius: "10px", color: "#FFFFFF", fontWeight: "700", fontSize: "14px", padding: "12px 24px", textDecoration: "none" }
const hr = { borderColor: "#E5E7EB", margin: "24px 0 16px" }
const footer = { color: "#9CA3AF", fontSize: "13px", margin: "0" }
const link = { color: "#2D7DF6" }
