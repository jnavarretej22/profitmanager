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

const DIA_NOMBRE: Record<string, string> = {
  lunes: "Lunes", martes: "Martes", miercoles: "Miércoles", jueves: "Jueves",
  viernes: "Viernes", sabado: "Sábado", domingo: "Domingo",
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
  diaBloque:    { marginBottom: 16 },
  diaTitulo:    { fontSize: 11, fontWeight: "bold", color: gris700, marginBottom: 6, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: gris200 },
  diaLibre:     { fontSize: 9, color: gris500, fontStyle: "italic", marginBottom: 4 },
  diaMacros:    { flexDirection: "row", gap: 12, marginBottom: 4 },
  comidaBloque: { marginBottom: 10 },
  comidaHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  comidaBadge:  { backgroundColor: "#EFF5FF", borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3, fontSize: 8, color: azul, fontWeight: "bold", marginRight: 8 },
  comidaHora:   { fontSize: 8, color: gris500 },
  comidaDesc:   { fontSize: 9, color: gris700, lineHeight: 1.5, marginBottom: 4 },
  macrosMiniFila:{ flexDirection: "row", gap: 10 },
  macroMini:    { fontSize: 8, color: gris500 },
  separador:    { borderBottomWidth: 1, borderBottomColor: gris200, marginVertical: 8 },
  totalesBox:   { backgroundColor: gris100, borderRadius: 6, padding: "8 12", marginBottom: 4 },
  totalesLabel: { fontSize: 7, color: gris500, marginTop: 1 },
  totalesValor: { fontSize: 11, fontWeight: "bold", color: azul },
  totalesRow:   { flexDirection: "row", gap: 14 },
  totalesItem:  { alignItems: "center" },
  footer:       { position: "absolute", bottom: 28, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: gris200, paddingTop: 8 },
  footerText:   { fontSize: 8, color: gris500 },
  watermark:    { fontSize: 8, color: naranja, fontWeight: "bold" },
})

interface Comida {
  momento:         string
  hora_sugerida:   string | null
  descripcion:     string
  calorias:        number | null
  proteinas_g:     number | null
  carbohidratos_g: number | null
  grasas_g:        number | null
}

interface DiaPlan {
  dia_semana:  string
  nombre_foco: string | null
  es_libre:    boolean
  comidas:     Comida[]
}

interface Props {
  plan: {
    nombre:            string
    objetivo:          string | null
    calorias_objetivo: number | null
    dias:              DiaPlan[]
  }
  alumno:        { nombre: string; apellido: string }
  coach:         { nombre: string; apellido: string; logo_url: string | null }
  marcaAgua:     boolean
  fechaGenerado: string
}

function macrosDia(comidas: Comida[]) {
  return comidas.reduce(
    (acc, c) => ({
      cal:   acc.cal   + (c.calorias        ?? 0),
      prot:  acc.prot  + (c.proteinas_g     ?? 0),
      carbs: acc.carbs + (c.carbohidratos_g ?? 0),
      grasas:acc.grasas+ (c.grasas_g        ?? 0),
    }),
    { cal: 0, prot: 0, carbs: 0, grasas: 0 }
  )
}

const ORDEN_DIAS = ["lunes","martes","miercoles","jueves","viernes","sabado","domingo"]

export function PlanAlimenticioPDF({ plan, alumno, coach, marcaAgua, fechaGenerado }: Props) {
  const diasOrdenados = [...plan.dias].sort(
    (a, b) => ORDEN_DIAS.indexOf(a.dia_semana) - ORDEN_DIAS.indexOf(b.dia_semana)
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

        {/* Días */}
        {diasOrdenados.map((dia, dIdx) => {
          const totals  = macrosDia(dia.comidas)
          const isLast  = dIdx === diasOrdenados.length - 1
          const MOMENTOS_ORDEN = ["desayuno","media_manana","almuerzo","merienda","cena"]
          const comidasOrd = [...dia.comidas].sort(
            (a, b) => MOMENTOS_ORDEN.indexOf(a.momento) - MOMENTOS_ORDEN.indexOf(b.momento)
          )

          return (
            <View key={dia.dia_semana} style={s.diaBloque} wrap={false}>
              <Text style={s.diaTitulo}>
                {DIA_NOMBRE[dia.dia_semana] ?? dia.dia_semana}
                {dia.nombre_foco ? ` — ${dia.nombre_foco}` : ""}
              </Text>

              {dia.es_libre ? (
                <Text style={s.diaLibre}>Día libre — sin plan nutricional.</Text>
              ) : (
                <>
                  {/* Totales del día */}
                  {totals.cal > 0 && (
                    <View style={s.totalesBox}>
                      <View style={s.totalesRow}>
                        <View style={s.totalesItem}>
                          <Text style={{ ...s.totalesValor, color: naranja }}>{totals.cal}</Text>
                          <Text style={s.totalesLabel}>kcal</Text>
                        </View>
                        <View style={s.totalesItem}>
                          <Text style={{ ...s.totalesValor, color: azul }}>{totals.prot}g</Text>
                          <Text style={s.totalesLabel}>Proteínas</Text>
                        </View>
                        <View style={s.totalesItem}>
                          <Text style={{ ...s.totalesValor, color: verde }}>{totals.carbs}g</Text>
                          <Text style={s.totalesLabel}>Carbos</Text>
                        </View>
                        <View style={s.totalesItem}>
                          <Text style={{ ...s.totalesValor, color: "#F59E0B" }}>{totals.grasas}g</Text>
                          <Text style={s.totalesLabel}>Grasas</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Comidas */}
                  {comidasOrd.map((comida, cIdx) => (
                    <View key={cIdx} style={s.comidaBloque}>
                      <View style={s.comidaHeader}>
                        <Text style={s.comidaBadge}>{MOMENTO_LABEL[comida.momento] ?? comida.momento}</Text>
                        {comida.hora_sugerida && (
                          <Text style={s.comidaHora}>{String(comida.hora_sugerida).slice(0, 5)}</Text>
                        )}
                      </View>
                      <Text style={s.comidaDesc}>{comida.descripcion}</Text>
                      <View style={s.macrosMiniFila}>
                        {comida.calorias        && <Text style={s.macroMini}>{comida.calorias} kcal</Text>}
                        {comida.proteinas_g     && <Text style={s.macroMini}>P: {comida.proteinas_g}g</Text>}
                        {comida.carbohidratos_g && <Text style={s.macroMini}>C: {comida.carbohidratos_g}g</Text>}
                        {comida.grasas_g        && <Text style={s.macroMini}>G: {comida.grasas_g}g</Text>}
                      </View>
                    </View>
                  ))}
                </>
              )}

              {!isLast && <View style={s.separador} />}
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
