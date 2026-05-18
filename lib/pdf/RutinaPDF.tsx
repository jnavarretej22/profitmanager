import {
  Document, Page, Text, View, StyleSheet, Image, Font,
} from "@react-pdf/renderer"

// Colores
const azul    = "#2D7DF6"
const gris900 = "#111827"
const gris700 = "#374151"
const gris500 = "#6B7280"
const gris200 = "#E5E7EB"
const gris100 = "#F3F4F6"
const naranja = "#F97316"

const OBJETIVO_LABEL: Record<string, string> = {
  hipertrofia:   "Hipertrofia",
  perdida_grasa: "Pérdida de grasa",
  fuerza:        "Fuerza",
  resistencia:   "Resistencia",
  general:       "General",
}

const DIA_LABEL: Record<string, string> = {
  lunes: "Lun", martes: "Mar", miercoles: "Mié",
  jueves: "Jue", viernes: "Vie", sabado: "Sáb", domingo: "Dom",
}

const s = StyleSheet.create({
  page:        { fontFamily: "Helvetica", fontSize: 10, color: gris900, padding: 40, backgroundColor: "#FFFFFF" },
  header:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: gris200 },
  headerLeft:  { flex: 1 },
  logo:        { fontSize: 18, fontWeight: "bold", color: azul },
  tagline:     { fontSize: 8, color: gris500, marginTop: 2 },
  logoImg:     { width: 120, height: 40, objectFit: "contain" },
  titulo:      { fontSize: 20, fontWeight: "bold", color: gris900, marginBottom: 4, letterSpacing: -0.5 },
  subtitulo:   { fontSize: 10, color: gris500 },
  seccion:     { marginBottom: 16 },
  secTitulo:   { fontSize: 11, fontWeight: "bold", color: azul, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  row:         { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  pill:        { backgroundColor: "#EFF5FF", borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, fontSize: 9, color: azul },
  table:       { borderWidth: 1, borderColor: gris200, borderRadius: 6, overflow: "hidden" },
  tableHead:   { flexDirection: "row", backgroundColor: gris100, borderBottomWidth: 1, borderBottomColor: gris200 },
  tableRow:    { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: gris200 },
  tableRowLast:{ flexDirection: "row" },
  thOrden:     { width: "5%",  padding: "6 8", fontSize: 8, fontWeight: "bold", color: gris500 },
  thNombre:    { width: "35%", padding: "6 8", fontSize: 8, fontWeight: "bold", color: gris500 },
  thSeries:    { width: "12%", padding: "6 8", fontSize: 8, fontWeight: "bold", color: gris500 },
  thReps:      { width: "15%", padding: "6 8", fontSize: 8, fontWeight: "bold", color: gris500 },
  thDescanso:  { width: "15%", padding: "6 8", fontSize: 8, fontWeight: "bold", color: gris500 },
  thRpe:       { width: "10%", padding: "6 8", fontSize: 8, fontWeight: "bold", color: gris500 },
  thNotas:     { width: "8%",  padding: "6 8", fontSize: 8, fontWeight: "bold", color: gris500 },
  tdOrden:     { width: "5%",  padding: "7 8", fontSize: 9, color: gris500 },
  tdNombre:    { width: "35%", padding: "7 8", fontSize: 9, fontWeight: "bold", color: gris900 },
  tdSeries:    { width: "12%", padding: "7 8", fontSize: 9, color: gris700 },
  tdReps:      { width: "15%", padding: "7 8", fontSize: 9, color: gris700 },
  tdDescanso:  { width: "15%", padding: "7 8", fontSize: 9, color: gris700 },
  tdRpe:       { width: "10%", padding: "7 8", fontSize: 9, color: gris700 },
  tdNotas:     { width: "8%",  padding: "7 8", fontSize: 8, color: gris500 },
  footer:      { position: "absolute", bottom: 28, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: gris200, paddingTop: 8 },
  footerText:  { fontSize: 8, color: gris500 },
  watermark:   { fontSize: 8, color: naranja, fontWeight: "bold" },
})

interface Ejercicio {
  orden: number
  nombre: string
  series: number
  repeticiones: string
  descanso_segundos: number
  rpe: string | null
  notas: string | null
}

interface Props {
  rutina: {
    nombre: string
    descripcion: string | null
    objetivo: string | null
    dias_semana: unknown
    duracion_minutos: number | null
    ejercicios: Ejercicio[]
  }
  alumno:   { nombre: string; apellido: string }
  coach:    { nombre: string; apellido: string; logo_url: string | null }
  marcaAgua: boolean
  fechaGenerado: string
}

export function RutinaPDF({ rutina, alumno, coach, marcaAgua, fechaGenerado }: Props) {
  const dias = Array.isArray(rutina.dias_semana) ? (rutina.dias_semana as string[]) : []

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.titulo}>{rutina.nombre}</Text>
            <Text style={s.subtitulo}>
              Alumno: {alumno.nombre} {alumno.apellido}
              {rutina.objetivo ? `  ·  Objetivo: ${OBJETIVO_LABEL[rutina.objetivo] ?? rutina.objetivo}` : ""}
            </Text>
          </View>
          {coach.logo_url && !marcaAgua ? (
            <Image src={coach.logo_url} style={s.logoImg} />
          ) : (
            <View>
              <Text style={s.logo}>ProFit Manager</Text>
              <Text style={s.tagline}>por {coach.nombre} {coach.apellido}</Text>
            </View>
          )}
        </View>

        {/* Info rápida */}
        <View style={s.seccion}>
          <View style={s.row}>
            {dias.length > 0 && dias.map((d) => (
              <Text key={d} style={s.pill}>{DIA_LABEL[d] ?? d}</Text>
            ))}
            {rutina.duracion_minutos && (
              <Text style={s.pill}>{rutina.duracion_minutos} min</Text>
            )}
            {rutina.objetivo && (
              <Text style={{ ...s.pill, backgroundColor: "#ECFDF3", color: "#16A34A" }}>
                {OBJETIVO_LABEL[rutina.objetivo] ?? rutina.objetivo}
              </Text>
            )}
          </View>
          {rutina.descripcion && (
            <Text style={{ fontSize: 9, color: gris700, lineHeight: 1.5 }}>{rutina.descripcion}</Text>
          )}
        </View>

        {/* Tabla ejercicios */}
        <View style={s.seccion}>
          <Text style={s.secTitulo}>Ejercicios ({rutina.ejercicios.length})</Text>
          <View style={s.table}>
            <View style={s.tableHead}>
              <Text style={s.thOrden}>#</Text>
              <Text style={s.thNombre}>Ejercicio</Text>
              <Text style={s.thSeries}>Series</Text>
              <Text style={s.thReps}>Reps</Text>
              <Text style={s.thDescanso}>Descanso</Text>
              <Text style={s.thRpe}>RPE</Text>
              <Text style={s.thNotas}>Notas</Text>
            </View>
            {rutina.ejercicios.map((ej, idx) => {
              const isLast = idx === rutina.ejercicios.length - 1
              return (
                <View key={ej.orden} style={isLast ? s.tableRowLast : s.tableRow}>
                  <Text style={s.tdOrden}>{ej.orden}</Text>
                  <Text style={s.tdNombre}>{ej.nombre}</Text>
                  <Text style={s.tdSeries}>{ej.series}</Text>
                  <Text style={s.tdReps}>{ej.repeticiones}</Text>
                  <Text style={s.tdDescanso}>{ej.descanso_segundos}s</Text>
                  <Text style={s.tdRpe}>{ej.rpe ?? "—"}</Text>
                  <Text style={s.tdNotas}>{ej.notas ?? "—"}</Text>
                </View>
              )
            })}
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Generado el {fechaGenerado}</Text>
          {marcaAgua ? (
            <Text style={s.watermark}>Powered by ProFit Manager</Text>
          ) : (
            <Text style={s.footerText}>{coach.nombre} {coach.apellido}</Text>
          )}
        </View>
      </Page>
    </Document>
  )
}
