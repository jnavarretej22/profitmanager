import {
  Document, Page, Text, View, StyleSheet, Image,
} from "@react-pdf/renderer"

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

const DIA_NOMBRE: Record<string, string> = {
  lunes: "Lunes", martes: "Martes", miercoles: "Miércoles",
  jueves: "Jueves", viernes: "Viernes", sabado: "Sábado", domingo: "Domingo",
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
  diaTitulo:   { fontSize: 10, fontWeight: "bold", color: gris900, marginBottom: 6, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: gris200 },
  diaFoco:     { fontSize: 9, color: gris500, fontWeight: "normal" },
  row:         { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  pill:        { backgroundColor: "#EFF5FF", borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, fontSize: 9, color: azul },
  table:       { borderWidth: 1, borderColor: gris200, borderRadius: 6, overflow: "hidden", marginBottom: 12 },
  tableHead:   { flexDirection: "row", backgroundColor: gris100, borderBottomWidth: 1, borderBottomColor: gris200 },
  tableRow:    { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: gris200 },
  tableRowLast:{ flexDirection: "row" },
  thOrden:     { width: "4%",  padding: "6 6", fontSize: 8, fontWeight: "bold", color: gris500 },
  thNombre:    { width: "24%", padding: "6 6", fontSize: 8, fontWeight: "bold", color: gris500 },
  thSeries:    { width: "8%",  padding: "6 6", fontSize: 8, fontWeight: "bold", color: gris500 },
  thReps:      { width: "10%", padding: "6 6", fontSize: 8, fontWeight: "bold", color: gris500 },
  thCarga:     { width: "10%", padding: "6 6", fontSize: 8, fontWeight: "bold", color: gris500 },
  thDescanso:  { width: "11%", padding: "6 6", fontSize: 8, fontWeight: "bold", color: gris500 },
  thRpe:       { width: "8%",  padding: "6 6", fontSize: 8, fontWeight: "bold", color: gris500 },
  thProg:      { width: "13%", padding: "6 6", fontSize: 8, fontWeight: "bold", color: gris500 },
  thNotas:     { width: "12%", padding: "6 6", fontSize: 8, fontWeight: "bold", color: gris500 },
  tdOrden:     { width: "4%",  padding: "7 6", fontSize: 9, color: gris500 },
  tdNombre:    { width: "24%", padding: "7 6", fontSize: 9, fontWeight: "bold", color: gris900 },
  tdSeries:    { width: "8%",  padding: "7 6", fontSize: 9, color: gris700 },
  tdReps:      { width: "10%", padding: "7 6", fontSize: 9, color: gris700 },
  tdCarga:     { width: "10%", padding: "7 6", fontSize: 9, fontWeight: "bold", color: "#EF4444" },
  tdDescanso:  { width: "11%", padding: "7 6", fontSize: 9, color: gris700 },
  tdRpe:       { width: "8%",  padding: "7 6", fontSize: 9, color: gris700 },
  tdProg:      { width: "13%", padding: "7 6", fontSize: 8, color: azul },
  tdNotas:     { width: "12%", padding: "7 6", fontSize: 8, color: gris500 },
  descansoDia: { fontSize: 9, color: gris500, fontStyle: "italic", paddingVertical: 6 },
  footer:      { position: "absolute", bottom: 28, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: gris200, paddingTop: 8 },
  footerText:  { fontSize: 8, color: gris500 },
  watermark:   { fontSize: 8, color: naranja, fontWeight: "bold" },
})

interface Ejercicio {
  orden: number
  nombre: string
  series: number
  repeticiones: string
  peso_kg: string | null
  descanso_segundos: number
  rpe: string | null
  progresion: string | null
  notas: string | null
}

interface DiaRutina {
  dia_semana: string
  nombre_foco: string | null
  es_descanso: boolean
  orden: number
  ejercicios: Ejercicio[]
}

interface Props {
  rutina: {
    nombre: string
    descripcion: string | null
    objetivo: string | null
    duracion_minutos: number | null
    dias: DiaRutina[]
  }
  alumno:        { nombre: string; apellido: string }
  coach:         { nombre: string; apellido: string; logo_url: string | null }
  marcaAgua:     boolean
  fechaGenerado: string
}

export function RutinaPDF({ rutina, alumno, coach, marcaAgua, fechaGenerado }: Props) {
  const ORDEN_DIAS = ["lunes","martes","miercoles","jueves","viernes","sabado","domingo"]
  const diasOrdenados = [...rutina.dias].sort(
    (a, b) => ORDEN_DIAS.indexOf(a.dia_semana) - ORDEN_DIAS.indexOf(b.dia_semana)
  )
  const diasEntrenamiento = diasOrdenados.filter((d) => !d.es_descanso)
  const totalEjercicios   = diasEntrenamiento.reduce((acc, d) => acc + d.ejercicios.length, 0)

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
            {rutina.duracion_minutos != null && (
              <Text style={s.pill}>{rutina.duracion_minutos} min</Text>
            )}
            {rutina.objetivo && (
              <Text style={{ ...s.pill, backgroundColor: "#ECFDF3", color: "#16A34A" }}>
                {OBJETIVO_LABEL[rutina.objetivo] ?? rutina.objetivo}
              </Text>
            )}
            <Text style={s.pill}>{diasEntrenamiento.length} días de entrenamiento</Text>
            <Text style={s.pill}>{totalEjercicios} ejercicios en total</Text>
          </View>
          {rutina.descripcion && (
            <Text style={{ fontSize: 9, color: gris700, lineHeight: 1.5 }}>{rutina.descripcion}</Text>
          )}
        </View>

        {/* Sección por día */}
        <View style={s.seccion}>
          <Text style={s.secTitulo}>Programa semanal</Text>

          {diasOrdenados.map((dia) => (
            <View key={dia.dia_semana} style={{ marginBottom: 14 }}>
              <Text style={s.diaTitulo}>
                {DIA_NOMBRE[dia.dia_semana] ?? dia.dia_semana}
                {dia.nombre_foco && !dia.es_descanso ? (
                  <Text style={s.diaFoco}>  ·  {dia.nombre_foco}</Text>
                ) : null}
                {dia.es_descanso ? (
                  <Text style={s.diaFoco}>  ·  Descanso</Text>
                ) : null}
              </Text>

              {dia.es_descanso ? (
                <Text style={s.descansoDia}>Día de descanso — recuperación activa.</Text>
              ) : (
                <View style={s.table}>
                  <View style={s.tableHead}>
                    <Text style={s.thOrden}>#</Text>
                    <Text style={s.thNombre}>Ejercicio</Text>
                    <Text style={s.thSeries}>Series</Text>
                    <Text style={s.thReps}>Reps</Text>
                    <Text style={s.thCarga}>Carga</Text>
                    <Text style={s.thDescanso}>Descanso</Text>
                    <Text style={s.thRpe}>RPE</Text>
                    <Text style={s.thProg}>Progresión</Text>
                    <Text style={s.thNotas}>Notas</Text>
                  </View>
                  {dia.ejercicios.map((ej, idx) => {
                    const isLast = idx === dia.ejercicios.length - 1
                    return (
                      <View key={ej.orden} style={isLast ? s.tableRowLast : s.tableRow}>
                        <Text style={s.tdOrden}>{ej.orden}</Text>
                        <Text style={s.tdNombre}>{ej.nombre}</Text>
                        <Text style={s.tdSeries}>{ej.series}</Text>
                        <Text style={s.tdReps}>{ej.repeticiones}</Text>
                        <Text style={s.tdCarga}>{ej.peso_kg ? `${ej.peso_kg} kg` : "—"}</Text>
                        <Text style={s.tdDescanso}>{ej.descanso_segundos}s</Text>
                        <Text style={s.tdRpe}>{ej.rpe ?? "—"}</Text>
                        <Text style={s.tdProg}>{ej.progresion ?? "—"}</Text>
                        <Text style={s.tdNotas}>{ej.notas ?? "—"}</Text>
                      </View>
                    )
                  })}
                </View>
              )}
            </View>
          ))}
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
