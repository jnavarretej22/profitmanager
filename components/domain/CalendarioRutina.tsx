"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, X, Dumbbell, Clock, RotateCcw, Timer } from "lucide-react"

interface Ejercicio {
  nombre:            string
  series:            number | null
  repeticiones:      string | null
  descanso_segundos: number | null
  rpe:               string | null
  notas:             string | null
  orden:             number
}

interface Rutina {
  id:               string
  nombre:           string
  objetivo:         string
  dias_semana:      string[]
  duracion_minutos: number | null
  ejercicios:       Ejercicio[]
}

interface Props {
  rutina: Rutina | null
}

const JS_DIA: Record<number, string> = {
  0: "domingo", 1: "lunes", 2: "martes", 3: "miercoles",
  4: "jueves",  5: "viernes", 6: "sabado",
}

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
]

const DIAS_CAB = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"]

const OBJETIVO_LABEL: Record<string, string> = {
  hipertrofia:   "Hipertrofia",
  perdida_grasa: "Pérdida de grasa",
  fuerza:        "Fuerza",
  resistencia:   "Resistencia",
  general:       "General",
}

function buildCuadricula(year: number, month: number) {
  const primerDia  = new Date(year, month, 1)
  const ultimoDia  = new Date(year, month + 1, 0)
  const inicio     = new Date(primerDia)
  inicio.setDate(primerDia.getDate() - primerDia.getDay())

  const celdas: Array<{ date: Date; esDelMes: boolean }> = []
  const cursor = new Date(inicio)

  while (celdas.length < 42) {
    celdas.push({ date: new Date(cursor), esDelMes: cursor.getMonth() === month })
    cursor.setDate(cursor.getDate() + 1)
    if (celdas.length >= 35 && cursor > ultimoDia && cursor.getDay() === 0) break
  }
  return celdas
}

function esHoy(date: Date, hoy: Date) {
  return (
    date.getDate()     === hoy.getDate() &&
    date.getMonth()    === hoy.getMonth() &&
    date.getFullYear() === hoy.getFullYear()
  )
}

// ── Modal de detalle del día ────────────────────────────────────────────────
function ModalDia({
  fecha,
  rutina,
  onCerrar,
}: {
  fecha:   Date
  rutina:  Rutina
  onCerrar: () => void
}) {
  const fechaLabel = fecha.toLocaleDateString("es-EC", {
    weekday: "long", day: "numeric", month: "long",
  })

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar() }}
    >
      {/* Panel */}
      <div
        className="w-full sm:max-w-md flex flex-col max-h-[90dvh] sm:max-h-[80vh]"
        style={{
          background:   "var(--background-card)",
          border:       "1px solid var(--border)",
          boxShadow:    "var(--shadow-lg)",
          borderRadius: "20px 20px 0 0",
        }}
      >
        {/* Handle móvil */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-10 rounded-full" style={{ background: "var(--gray-300)" }} />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--blue-bg)" }}
            >
              <Dumbbell size={17} style={{ color: "var(--blue)" }} />
            </div>
            <div>
              <p className="text-sm font-bold capitalize" style={{ color: "var(--foreground)" }}>
                {fechaLabel}
              </p>
              <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                {rutina.nombre}
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="h-8 w-8 flex items-center justify-center rounded-xl transition-colors flex-shrink-0"
            style={{ color: "var(--foreground-muted)", background: "var(--gray-100)" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Meta */}
        <div
          className="flex items-center gap-4 px-5 py-3 border-b flex-wrap"
          style={{ borderColor: "var(--border)", background: "var(--gray-50)" }}
        >
          <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--foreground-muted)" }}>
            <RotateCcw size={12} />
            {OBJETIVO_LABEL[rutina.objetivo] ?? rutina.objetivo}
          </span>
          {rutina.duracion_minutos && (
            <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--foreground-muted)" }}>
              <Clock size={12} />
              {rutina.duracion_minutos} min
            </span>
          )}
          <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--foreground-muted)" }}>
            <Dumbbell size={12} />
            {rutina.ejercicios.length} ejercicios
          </span>
        </div>

        {/* Lista ejercicios — scrollable */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
          {rutina.ejercicios.map((ej) => (
            <div
              key={ej.orden}
              className="flex gap-3 rounded-xl p-3"
              style={{ background: "var(--gray-50)", border: "1px solid var(--border)" }}
            >
              {/* Número */}
              <span
                className="h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5"
                style={{ background: "var(--blue)", color: "white" }}
              >
                {ej.orden}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  {ej.nombre}
                </p>
                {/* Chips de datos */}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {ej.series && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{ background: "var(--blue-bg)", color: "var(--blue)" }}
                    >
                      {ej.series} series
                    </span>
                  )}
                  {ej.repeticiones && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{ background: "var(--green-bg)", color: "var(--green)" }}
                    >
                      {ej.repeticiones} reps
                    </span>
                  )}
                  {ej.descanso_segundos && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1"
                      style={{ background: "var(--orange-bg)", color: "var(--orange)" }}
                    >
                      <Timer size={10} />
                      {ej.descanso_segundos}s
                    </span>
                  )}
                  {ej.rpe && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{ background: "var(--purple-bg, #f3f0ff)", color: "var(--purple)" }}
                    >
                      RPE {ej.rpe}
                    </span>
                  )}
                </div>
                {ej.notas && (
                  <p className="text-[11px] mt-1.5 italic" style={{ color: "var(--foreground-subtle)" }}>
                    {ej.notas}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={onCerrar}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: "var(--gray-100)", color: "var(--foreground)" }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ────────────────────────────────────────────────────
export function CalendarioRutina({ rutina }: Props) {
  const hoy  = new Date()
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [mes,  setMes]  = useState(hoy.getMonth())
  const [diaModal, setDiaModal] = useState<Date | null>(null)

  const diasRutina = rutina?.dias_semana ?? []
  const cuadricula = buildCuadricula(anio, mes)

  function navAnterior() {
    if (mes === 0) { setMes(11); setAnio(a => a - 1) } else setMes(m => m - 1)
  }
  function navSiguiente() {
    if (mes === 11) { setMes(0); setAnio(a => a + 1) } else setMes(m => m + 1)
  }

  function tieneRutina(d: Date) { return diasRutina.includes(JS_DIA[d.getDay()]) }

  function handleClick(celda: { date: Date; esDelMes: boolean }) {
    if (!celda.esDelMes || !rutina || !tieneRutina(celda.date)) return
    setDiaModal(celda.date)
  }

  // Nombre corto del día en móvil (solo 1 letra) y desktop (3 letras)
  return (
    <>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--background-card)",
          border:     "1px solid var(--border)",
          boxShadow:  "var(--shadow-sm)",
        }}
      >
        {/* ── Header ──────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-4 sm:px-5 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="min-w-0">
            <h2 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
              Calendario de entrenamiento
            </h2>
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--foreground-muted)" }}>
              {rutina
                ? `${rutina.nombre} · ${diasRutina.length} día${diasRutina.length !== 1 ? "s" : ""}/semana`
                : "Sin rutina asignada"}
            </p>
          </div>

          {/* Navegación mes */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-3">
            <button
              onClick={navAnterior}
              className="h-8 w-8 flex items-center justify-center rounded-xl transition-colors"
              style={{ color: "var(--foreground-muted)", background: "var(--gray-100)" }}
              aria-label="Mes anterior"
            >
              <ChevronLeft size={15} />
            </button>
            <span
              className="text-xs sm:text-sm font-bold text-center"
              style={{ color: "var(--foreground)", minWidth: "90px" }}
            >
              {MESES[mes].slice(0, 3)} {anio}
            </span>
            <button
              onClick={navSiguiente}
              className="h-8 w-8 flex items-center justify-center rounded-xl transition-colors"
              style={{ color: "var(--foreground-muted)", background: "var(--gray-100)" }}
              aria-label="Mes siguiente"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* ── Cabecera días ────────────────────────────────── */}
        <div
          className="grid grid-cols-7 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          {DIAS_CAB.map((d) => (
            <div
              key={d}
              className="py-2 text-center font-bold"
              style={{ color: "var(--foreground-muted)", fontSize: "11px" }}
            >
              {/* 1 letra en móvil, 3 en desktop */}
              <span className="sm:hidden">{d[0]}</span>
              <span className="hidden sm:inline">{d}</span>
            </div>
          ))}
        </div>

        {/* ── Sin rutina ────────────────────────────────────── */}
        {!rutina ? (
          <div className="py-12 text-center px-4">
            <Dumbbell size={26} className="mx-auto mb-2.5" style={{ color: "var(--foreground-subtle)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Sin rutina asignada
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
              Cuando tu coach te asigne una rutina, aparecerá aquí
            </p>
          </div>
        ) : (
          /* ── Cuadrícula ────────────────────────────────────── */
          <div className="grid grid-cols-7 gap-px p-2 sm:p-3">
            {cuadricula.map((celda, i) => {
              const conRutina   = celda.esDelMes && tieneRutina(celda.date)
              const hoyFlag     = esHoy(celda.date, hoy)
              const clickable   = celda.esDelMes && conRutina

              return (
                <button
                  key={i}
                  onClick={() => handleClick(celda)}
                  disabled={!clickable}
                  aria-label={clickable ? `Ver rutina del ${celda.date.getDate()}` : undefined}
                  className="flex flex-col items-center rounded-xl transition-all select-none"
                  style={{
                    padding:    "4px 2px 6px",
                    cursor:     clickable ? "pointer" : "default",
                    background: hoyFlag && conRutina ? "var(--blue)"
                              : hoyFlag              ? "var(--blue-bg)"
                              : conRutina            ? "var(--blue-bg)"
                              : "transparent",
                    border:     hoyFlag && !conRutina
                              ? "2px solid var(--blue)"
                              : "2px solid transparent",
                    opacity:    !celda.esDelMes ? 0.3 : 1,
                  }}
                >
                  {/* Número del día */}
                  <span
                    className="text-xs sm:text-sm font-bold leading-none"
                    style={{
                      color: hoyFlag && conRutina ? "white"
                           : hoyFlag              ? "var(--blue)"
                           : conRutina            ? "var(--blue)"
                           : "var(--foreground-muted)",
                    }}
                  >
                    {celda.date.getDate()}
                  </span>

                  {/* Etiqueta con nombre corto de la rutina */}
                  {conRutina && (
                    <span
                      className="mt-1 rounded-full font-bold leading-none truncate max-w-full"
                      style={{
                        fontSize:   "8px",
                        padding:    "1px 5px",
                        background: hoyFlag ? "rgba(255,255,255,0.25)" : "var(--blue)",
                        color:      "white",
                        maxWidth:   "90%",
                        display:    "block",
                        textAlign:  "center",
                        overflow:   "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                      }}
                      title={rutina.nombre}
                    >
                      {/* Máx 6 caracteres para que entre en celdas pequeñas */}
                      {rutina.nombre.length > 6
                        ? rutina.nombre.slice(0, 6).toUpperCase()
                        : rutina.nombre.toUpperCase()}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* ── Leyenda ────────────────────────────────────────── */}
        {rutina && (
          <div
            className="flex items-center gap-3 sm:gap-5 px-4 sm:px-5 py-2.5 border-t flex-wrap"
            style={{ borderColor: "var(--border)" }}
          >
            <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--foreground-muted)" }}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--blue-bg)", border: "1.5px solid var(--blue)" }} />
              Hoy
            </span>
            <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--foreground-muted)" }}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--blue)" }} />
              Entrenamiento · toca clic para ver
            </span>
          </div>
        )}
      </div>

      {/* ── Modal de detalle ─────────────────────────────────── */}
      {diaModal && rutina && (
        <ModalDia
          fecha={diaModal}
          rutina={rutina}
          onCerrar={() => setDiaModal(null)}
        />
      )}
    </>
  )
}
