import Link from "next/link"
import type { Metadata } from "next"
import {
  Rocket, Users, Dumbbell, UtensilsCrossed, Calendar,
  TrendingUp, Globe, Inbox, CreditCard, HelpCircle, ChevronRight,
} from "lucide-react"
import { GuiaTOC, GuiaTOCMobile } from "../_components/GuiaTOC"
import { Seccion, Item, Callout } from "../_components/Seccion"

export const metadata: Metadata = {
  title:       "Guía del coach",
  description: "Aprende a usar ProFit Manager como coach: gestiona alumnos, crea rutinas y planes alimenticios, agenda citas con Meet y sigue el progreso de cada uno.",
}

const SECCIONES = [
  { id: "empezar",     label: "Empezar en 5 minutos" },
  { id: "alumnos",     label: "Gestión de alumnos" },
  { id: "rutinas",     label: "Rutinas" },
  { id: "planes",      label: "Planes alimenticios" },
  { id: "agenda",      label: "Agenda y citas" },
  { id: "progreso",    label: "Seguimiento de progreso" },
  { id: "perfil",      label: "Perfil público" },
  { id: "solicitudes", label: "Solicitudes" },
  { id: "mi-plan",     label: "Mi plan" },
  { id: "faq",         label: "Preguntas frecuentes" },
]

export default function GuiaCoachPage() {
  return (
    <div className="px-4 sm:px-6 pt-24 pb-16">
      <div className="mx-auto max-w-6xl">
        {/* Hero */}
        <header className="mb-10 text-center max-w-2xl mx-auto">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold mb-4"
            style={{ background: "var(--blue-bg)", color: "var(--blue)" }}
          >
            Para coaches
          </span>
          <h1
            className="text-3xl sm:text-4xl font-extrabold mb-4"
            style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}
          >
            Guía del coach
          </h1>
          <p className="text-base sm:text-lg" style={{ color: "var(--foreground-muted)", lineHeight: "1.6" }}>
            Todo lo que necesitas para dominar ProFit Manager y dejar de depender de WhatsApp y hojas de cálculo.
          </p>
        </header>

        <div className="grid lg:grid-cols-[220px_1fr] gap-8">
          <GuiaTOC secciones={SECCIONES} />

          <main className="min-w-0 max-w-3xl">
            <GuiaTOCMobile secciones={SECCIONES} />

            <Seccion
              id="empezar"
              numero={1}
              icono={Rocket}
              titulo="Empezar en 5 minutos"
              resumen="Del registro a tu primer alumno con rutina asignada."
            >
              <Item titulo="1. Crea tu cuenta">
                Entra a <Link href="/registro" className="underline font-semibold" style={{ color: "var(--blue)" }}>/registro</Link>{" "}
                con tu email y una contraseña de mínimo 6 caracteres. Empiezas en el plan Gratis (3 alumnos incluidos).
              </Item>
              <Item titulo="2. Completa tu perfil">
                En <strong>Mi perfil</strong> agrega tu nombre, foto, especialidad y zona horaria. Esto se usa en los PDFs, en las citas y en tu perfil público.
              </Item>
              <Item titulo="3. Registra a tu primer alumno">
                Ve a <strong>Alumnos → Crear alumno</strong>. Necesitas su email — el sistema le enviará un link para que active su cuenta y cree su propia contraseña.
              </Item>
              <Item titulo="4. Asígnale una rutina">
                Desde el detalle del alumno, "Nueva rutina". Puedes crearla manual o partir de un template del sistema (plan Inicial).
              </Item>
              <Callout tipo="tip">
                Tras crear un alumno, un toast te ofrece "Asignar rutina ahora" — atajo directo al editor con el alumno preseleccionado.
              </Callout>
            </Seccion>

            <Seccion
              id="alumnos"
              numero={2}
              icono={Users}
              titulo="Gestión de alumnos"
              resumen="El núcleo de tu trabajo. Cada alumno es una cuenta independiente que tú creas y administras."
            >
              <Item titulo="Crear, editar, archivar">
                En <strong>Alumnos</strong> tienes filtros y búsqueda. Los alumnos archivados no cuentan contra tu límite.
              </Item>
              <Item titulo="Activación por email (sin contraseñas temporales)">
                Cuando creas un alumno, recibe un email con un link. Al entrar a /login con su email, el sistema detecta que es primer acceso y le pide crear su contraseña. Tú nunca conoces sus credenciales.
              </Item>
              <Item titulo="Reenviar email de activación">
                Si el alumno perdió el email, desde su detalle hay un botón "Reenviar email de activación" (visible solo si aún no activó).
              </Item>
              <Item titulo="Mediciones">
                <strong>Tú</strong> ingresas peso, medidas y % de grasa del alumno. El alumno NO puede editar sus datos de progreso — solo verlos.
              </Item>
              <Callout tipo="info">
                Límites por plan: <strong>Gratis</strong> 3 alumnos activos, <strong>Inicial</strong> 10 alumnos activos. Al alcanzar el tope, el botón "Crear alumno" se bloquea.
              </Callout>
            </Seccion>

            <Seccion
              id="rutinas"
              numero={3}
              icono={Dumbbell}
              titulo="Rutinas"
              resumen="Programa el entrenamiento semanal. Cada rutina tiene días con ejercicios (series, reps, peso, descanso, RPE)."
            >
              <Item titulo="Crear desde cero">
                En <strong>Rutinas → Nueva rutina</strong>. Tabs por día (Lunes a Domingo), marcas días como descanso, agregas ejercicios con drag para reordenar.
              </Item>
              <Item titulo="Usar un template del sistema (plan Inicial)">
                Botón "Usar template" en el editor. Templates por objetivo: hipertrofia, pérdida de grasa, fuerza, resistencia, general. Carga la estructura y la adaptas.
              </Item>
              <Item titulo="Guardar como template">
                Tras crear una rutina asignada a un alumno, botón "Guardar como template" la clona como plantilla reusable. Útil cuando llegas a una rutina que funciona y quieres aplicarla a más alumnos.
              </Item>
              <Item titulo="Asignar rutina">
                En el editor, selector "Alumno asignado". Puedes asignar la misma rutina a varios alumnos (cada uno con su propio progreso).
              </Item>
              <Item titulo="Vigencia (opcional)">
                Define hasta qué fecha es válida la rutina. El alumno la verá vencida después de esa fecha — útil para ciclos de N semanas.
              </Item>
              <Callout tipo="info">
                Los días sin ejercicios se guardan automáticamente como descanso para que la vista del alumno no muestre días vacíos confusos.
              </Callout>
            </Seccion>

            <Seccion
              id="planes"
              numero={4}
              icono={UtensilsCrossed}
              titulo="Planes alimenticios"
              resumen="Diseña la comida del alumno por día y por momento del día. Calorías y macros incluidos."
            >
              <Item titulo="Estructura">
                Por día: define comidas (desayuno, media mañana, almuerzo, merienda, cena), hora sugerida, descripción y macros (kcal, proteínas, carbos, grasas).
              </Item>
              <Item titulo="Templates por objetivo (plan Inicial)">
                Templates con comida LATAM real — no genéricos. Igual que las rutinas: cargas un template y lo adaptas.
              </Item>
              <Item titulo="Día libre">
                Marca un día como "libre" si no quieres restricción ese día (cheat day o flexibilidad social).
              </Item>
              <Item titulo="Macros agregados">
                El editor suma los macros del día automáticamente. Visualizas las proporciones en una barra.
              </Item>
            </Seccion>

            <Seccion
              id="agenda"
              numero={5}
              icono={Calendar}
              titulo="Agenda y citas"
              resumen="Sesiones presenciales o videollamadas con Meet automático."
            >
              <Item titulo="Crear cita">
                En <strong>Agenda → Nueva cita</strong>. Eliges alumno, modalidad (presencial / online), fecha y hora.
              </Item>
              <Item titulo="Google Meet automático (plan Inicial)">
                Si la cita es online, ProFit genera un link de Meet automáticamente vía Google Calendar API. Necesitas conectar tu cuenta de Google una vez desde Mi perfil.
              </Item>
              <Item titulo="Estados de la cita">
                Agendada → Completada / Cancelada. El estado lo cambia el coach desde el detalle.
              </Item>
              <Callout tipo="warning">
                Si tu plan vence, las citas existentes siguen visibles pero no puedes crear nuevas hasta renovar.
              </Callout>
            </Seccion>

            <Seccion
              id="progreso"
              numero={6}
              icono={TrendingUp}
              titulo="Seguimiento de progreso"
              resumen="Mediciones históricas + gráficas (plan Inicial)."
            >
              <Item titulo="Registrar medición">
                Desde el detalle del alumno, tab "Mediciones → Nueva". Registras: fecha, peso, cintura, cadera, pecho, brazo, pierna, % grasa, notas.
              </Item>
              <Item titulo="Gráficas (plan Inicial)">
                Vista de evolución por medida en el tiempo. El alumno también las ve en su panel.
              </Item>
              <Item titulo="Adherencia">
                Si el alumno hace check-in de sus entrenamientos, ves su racha (días seguidos) y cumplimiento.
              </Item>
            </Seccion>

            <Seccion
              id="perfil"
              numero={7}
              icono={Globe}
              titulo="Perfil público (plan Inicial)"
              resumen="Una landing tuya pública en profitmanager.app/tu-slug para captar alumnos."
            >
              <Item titulo="Configurar">
                En <strong>Mi perfil público</strong>: elige tu slug (URL), agrega foto, especialidades, años de experiencia, ciudad, Instagram, WhatsApp.
              </Item>
              <Item titulo="Compartir">
                Tu URL queda como <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--background-hover)" }}>profitmanager.app/tu-slug</code>. La compartes en redes y tus seguidores pueden solicitar inscripción contigo.
              </Item>
              <Item titulo="Activar/desactivar">
                Toggle "Perfil público activo". Al desactivar, la URL devuelve 404.
              </Item>
            </Seccion>

            <Seccion
              id="solicitudes"
              numero={8}
              icono={Inbox}
              titulo="Solicitudes de inscripción"
              resumen="Cuando alguien quiere ser tu alumno desde tu perfil público."
            >
              <Item titulo="Recibir">
                En <strong>Solicitudes</strong> ves todas las pendientes con nombre, email, teléfono y mensaje.
              </Item>
              <Item titulo="Aprobar">
                Click "Aprobar" → el sistema crea el alumno, le envía el email de activación, y la solicitud queda como "aprobada".
              </Item>
              <Item titulo="Rechazar">
                Click "Rechazar" → opcionalmente notificas al solicitante. Puedes agregar una nota interna (solo tú la ves).
              </Item>
              <Callout tipo="info">
                Verificación de cupo: si no tienes alumnos disponibles en tu plan, el botón "Aprobar" se bloquea hasta que subas de plan.
              </Callout>
            </Seccion>

            <Seccion
              id="mi-plan"
              numero={9}
              icono={CreditCard}
              titulo="Mi plan"
              resumen="Gratis vs Inicial, upgrades y vencimientos."
            >
              <Item titulo="Plan Gratis ($0)">
                Hasta 3 alumnos · rutinas manuales · 1 plantilla de plan alimenticio · marca de agua en la vista del alumno.
              </Item>
              <Item titulo="Plan Inicial ($15/mes o $144/año)">
                Hasta 10 alumnos · templates por objetivo · gráficas · Meet automático · perfil público · sin marca de agua.
              </Item>
              <Item titulo="Cómo subir de plan">
                En <strong>Mi plan</strong> ves los datos bancarios para transferencia. Envías comprobante por WhatsApp o email. Soporte registra el pago y tu plan se activa.
              </Item>
              <Item titulo="¿Qué pasa cuando vence?">
                Te notificamos 15, 7, 3 y 1 días antes. Tras vencer, sigues con acceso 3 días en silencio (período de gracia). Después: <strong>modo solo lectura</strong> — ves toda tu data pero no puedes crear ni editar. Los datos nunca se eliminan.
              </Item>
            </Seccion>

            <Seccion
              id="faq"
              numero={10}
              icono={HelpCircle}
              titulo="Preguntas frecuentes"
            >
              <Item titulo="¿Qué pasa si supero el límite de alumnos al bajar de plan?">
                Los alumnos más antiguos se archivan automáticamente (no se eliminan). Al subir de plan otra vez, puedes reactivarlos.
              </Item>
              <Item titulo="¿Puedo cobrar a mis alumnos desde la plataforma?">
                No en el MVP. Tú cobras a tus alumnos por fuera (WhatsApp/transferencia). ProFit gestiona el contenido, no los pagos entre coach y alumno.
              </Item>
              <Item titulo="¿Mis alumnos ven mis otros alumnos?">
                No. Cada alumno solo ve sus propios datos y los del coach.
              </Item>
              <Item titulo="¿Puedo exportar todo?">
                Sí, los PDFs de rutinas y planes alimenticios incluyen logo (plan Inicial sin marca de agua).
              </Item>
            </Seccion>

            {/* CTA final */}
            <div
              className="rounded-2xl p-8 text-center mt-10"
              style={{ background: "linear-gradient(135deg, var(--blue-bg), var(--orange-bg))" }}
            >
              <h3 className="text-2xl font-extrabold mb-2" style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}>
                ¿Listo para empezar?
              </h3>
              <p className="text-sm mb-6" style={{ color: "var(--foreground-muted)" }}>
                Crea tu cuenta gratis y registra a tu primer alumno hoy mismo.
              </p>
              <Link href="/registro" className="btn-primary px-7 py-3.5 text-base">
                Empezar gratis <ChevronRight size={18} />
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
