import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"

const azul    = "#2D7DF6"
const verde   = "#22C55E"
const naranja = "#F97316"
const gris900 = "#111827"
const gris700 = "#374151"
const gris500 = "#6B7280"
const gris200 = "#E5E7EB"
const gris100 = "#F3F4F6"

const MOMENTO_LABEL: Record<string, string> = {
  desayuno:     "Desayuno",
  media_manana: "Media mañana",
  almuerzo:     "Almuerzo",
  merienda:     "Merienda",
  cena:         "Cena",
}

const OBJETIVO_LABEL: Record<string, string> = {
  hipertrofia:   "Hipertrofia",
  perdida_grasa: "Pérdida de grasa",
  fuerza:        "Fuerza",
  resistencia:   "Resistencia",
  general:       "General",
}

const s = StyleSheet.create({
  page:         { fontFamily: "Helvetica", fontSize: 10, color: gris900, padding: 40, backgroundColor: "#FFFFFF" },
  header:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: gris200 },
  headerLeft:   { flex: 1 },
  logo:         { fontSize: 16, fontWeight: "bold", color: azul },
  tagline:      { fontSize: 8, color: gris500, marginTop: 2 },
  logoImg:      { width: 110, height: 36, objectFit: "contain" },
  titulo:       { fontSize: 18, fontWeight: "bold", color: gris900, marginBottom: 3 },
  subtitulo:    { fontSize: 9, color: gris500 },
  macrosRow:    { flexDirection: "row", gap: 8, marginBottom: 18 },
  macroCard:    { flex: 1, backgroundColor: gris100, borderRadius: 6, padding: "8 10" },
  macroLabel:   { fontSize: 7, color: gris500, marginBottom: 2, textTransform: "uppercase" },
  macroValor:   { fontSize: 13, fontWeight: "bold" },
  comidaBloque: { marginBottom: 14 },
  comidaHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  comidaBadge:  { backgroundColor: "#EFF5FF", borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3, fontSize: 8, color: azul, fontWeight: "bold", marginRight: 8 },
  comidaHora:   { fontSize: 8, color: gris500 },
  comidaDesc:   { fontSize: 9, color: gris700, lineHeight: 1.5, marginBottom: 5 },
  macrosMiniFila:{ flexDirection: "row", gap: 12 },
  macroMini:    { fontSize: 8, color: gris500 },
  separador:    { borderBottomWidth: 1, borderBottomColor: gris200, marginBottom: 14 },
  footer:       { position: "absolute", bottom: 28, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: gris200, paddingTop: 8 },
  footerText:   { fontSize: 8, color: gris500 },
  watermark:    { fontSize: 8, color: naranja, fontWeight: "bold" },
  totalesBox:   { backgroundColor: gris100, borderRadius: 6, padding: "10 12", marginBottom: 18 },
  totalesTitulo:{ fontSize: 9, fontWeight: "bold", color: gris700, marginBottom: 6 },
  totalesRow:   { flexDirection: "row", gap: 16 },
  totalesItem:  { alignItems: "center" },
  totalesValor: { fontSize: 14, fontWeight: "bold", color: azul },
  totalesLabel: { fontSize: 7, color: gris500, marginTop: 1 },
})

interface Comida {
  momento: string
  hora_sugerida: string | null
  descripcion: string
  calorias: number | null
  proteinas_g: number | null
  carbohidratos_g: number | null
  grasas_g: number | null
}

interface Props {
  plan: {
    nombre: string
    objetivo: string | null
    calorias_objetivo: number | null
    comidas: Comida[]
  }
  alumno:    { nombre: string; apellido: string }
  coach:     { nombre: string; apellido: string; logo_url: string | null }
  marcaAgua: boolean
  fechaGenerado: string
}

export function PlanAlimenticioPDF({ plan, alumno, coach, marcaAgua, fechaGenerado }: Props) {
  const totalCal   = plan.comidas.reduce((s, c) => s + (c.calorias ?? 0), 0)
  const totalProt  = plan.comidas.reduce((s, c) => s + (c.proteinas_g ?? 0), 0)
  const totalCarbs = plan.comidas.reduce((s, c) => s + (c.carbohidratos_g ?? 0), 0)
  const totalGrasas= plan.comidas.reduce((s, c) => s + (c.grasas_g ?? 0), 0)

  const MOMENTOS_ORDEN = ["desayuno","media_manana","almuerzo","merienda","cena"]
  const comidasOrdenadas = [...plan.comidas].sort(
    (a, b) => MOMENTOS_ORDEN.indexOf(a.momento) - MOMENTOS_ORDEN.indexOf(b.momento)
  )

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.titulo}>{plan.nombre}</Text>
            <Text style={s.subtitulo}>
              Alumno: {alumno.nombre} {alumno.apellido}
              {plan.objetivo ? `  ·  Objetivo: ${OBJETIVO_LABEL[plan.objetivo] ?? plan.objetivo}` : ""}
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

        {/* Totales del día */}
        <View style={s.totalesBox}>
          <Text style={s.totalesTitulo}>Totales del día</Text>
          <View style={s.totalesRow}>
            <View style={s.totalesItem}>
              <Text style={{ ...s.totalesValor, color: naranja }}>{totalCal}</Text>
              <Text style={s.totalesLabel}>kcal</Text>
            </View>
            <View style={s.totalesItem}>
              <Text style={{ ...s.totalesValor, color: azul }}>{totalProt}g</Text>
              <Text style={s.totalesLabel}>Proteínas</Text>
            </View>
            <View style={s.totalesItem}>
              <Text style={{ ...s.totalesValor, color: verde }}>{totalCarbs}g</Text>
              <Text style={s.totalesLabel}>Carbos</Text>
            </View>
            <View style={s.totalesItem}>
              <Text style={{ ...s.totalesValor, color: "#F59E0B" }}>{totalGrasas}g</Text>
              <Text style={s.totalesLabel}>Grasas</Text>
            </View>
            {plan.calorias_objetivo && (
              <View style={s.totalesItem}>
                <Text style={{ ...s.totalesValor, color: gris700 }}>{plan.calorias_objetivo}</Text>
                <Text style={s.totalesLabel}>Meta kcal</Text>
              </View>
            )}
          </View>
        </View>

        {/* Comidas */}
        {comidasOrdenadas.map((comida, idx) => {
          const isLast = idx === comidasOrdenadas.length - 1
          return (
            <View key={idx} style={s.comidaBloque} wrap={false}>
              <View style={s.comidaHeader}>
                <Text style={s.comidaBadge}>{MOMENTO_LABEL[comida.momento] ?? comida.momento}</Text>
                {comida.hora_sugerida && (
                  <Text style={s.comidaHora}>{String(comida.hora_sugerida).slice(0,5)}</Text>
                )}
              </View>
              <Text style={s.comidaDesc}>{comida.descripcion}</Text>
              <View style={s.macrosMiniFila}>
                {comida.calorias       && <Text style={s.macroMini}>{comida.calorias} kcal</Text>}
                {comida.proteinas_g    && <Text style={s.macroMini}>P: {comida.proteinas_g}g</Text>}
                {comida.carbohidratos_g&& <Text style={s.macroMini}>C: {comida.carbohidratos_g}g</Text>}
                {comida.grasas_g       && <Text style={s.macroMini}>G: {comida.grasas_g}g</Text>}
              </View>
              {!isLast && <View style={{ ...s.separador, marginTop: 10 }} />}
            </View>
          )
        })}

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
