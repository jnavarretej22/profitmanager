import Link from "next/link"
import type { Metadata } from "next"
import {
  LogIn, Dumbbell, UtensilsCrossed, TrendingUp,
  Calendar, MessageCircle, User, Shield, ChevronRight,
} from "lucide-react"
import { GuiaTOC, GuiaTOCMobile } from "../_components/GuiaTOC"
import { Seccion, Item, Callout } from "../_components/Seccion"

export const metadata: Metadata = {
  title:       "Guía del alumno",
  description: "Aprende a usar ProFit Manager como alumno: cómo ver tu rutina, marcar tus comidas, ver tu progreso y contactar a tu coach.",
}

const SECCIONES = [
  { id: "primer-ingreso", label: "Tu primer ingreso" },
  { id: "rutina",         label: "Tu rutina" },
  { id: "alimentacion",   label: "Tu plan alimenticio" },
  { id: "progreso",       label: "Tu progreso" },
  { id: "agenda",         label: "Tu agenda" },
  { id: "contactar",      label: "Contactar a tu coach" },
  { id: "perfil",         label: "Tu perfil" },
  { id: "limites",        label: "Lo que puedes y no puedes hacer" },
]

export default function GuiaAlumnoPage() {
  return (
    <div className="px-4 sm:px-6 pt-24 pb-16">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 text-center max-w-2xl mx-auto">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold mb-4"
            style={{ background: "var(--orange-bg)", color: "var(--orange)" }}
          >
            Para alumnos
          </span>
          <h1
            className="text-3xl sm:text-4xl font-extrabold mb-4"
            style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}
          >
            Guía del alumno
          </h1>
          <p className="text-base sm:text-lg" style={{ color: "var(--foreground-muted)", lineHeight: "1.6" }}>
            Todo lo que necesitas saber para sacarle el máximo a tu plan con tu coach.
          </p>
        </header>

        <div className="grid lg:grid-cols-[220px_1fr] gap-8">
          <GuiaTOC secciones={SECCIONES} />

          <main className="min-w-0 max-w-3xl">
            <GuiaTOCMobile secciones={SECCIONES} />

            <Seccion
              id="primer-ingreso"
              numero={1}
              icono={LogIn}
              titulo="Tu primer ingreso"
              resumen="Tu coach te creó la cuenta. Solo necesitas crear tu contraseña."
            >
              <Item titulo="1. Recibiste un email">
                Tu coach te registró y recibiste un email de bienvenida con un link que te lleva a <strong>/login</strong>.
              </Item>
              <Item titulo="2. Escribe tu email">
                En el login, escribe el email con el que te registró tu coach. El sistema detecta automáticamente que es tu primer ingreso.
              </Item>
              <Item titulo="3. Crea tu contraseña">
                El formulario se transforma en "Activa tu cuenta": pide una contraseña (mínimo 6 caracteres) y la repites para confirmar.
              </Item>
              <Item titulo="4. ¡Listo!">
                Entras directamente a tu panel. La próxima vez que ingreses, usas el mismo email + tu contraseña.
              </Item>
              <Callout tipo="warning">
                Si perdiste el email, pídele a tu coach que lo <strong>reenvíe</strong> desde su panel. También puedes usar "Recuperar contraseña" si ya la habías creado.
              </Callout>
            </Seccion>

            <Seccion
              id="rutina"
              numero={2}
              icono={Dumbbell}
              titulo="Tu rutina"
              resumen="Tu programa de entrenamiento semanal. Lo crea tu coach, tú lo ejecutas."
            >
              <Item titulo="Vista semanal">
                En <strong>Mi rutina</strong> verás cada día de la semana con sus ejercicios: nombre, series, repeticiones, peso sugerido, descanso entre series y RPE (esfuerzo percibido).
              </Item>
              <Item titulo="Calendario">
                En tu panel principal hay un calendario mensual. Los días con entrenamiento aparecen marcados — click en uno para ver los ejercicios de ese día.
              </Item>
              <Item titulo="Check-in del día">
                Después de entrenar, registra tu sesión: marca como <strong>completada / parcial / no realizada</strong>, califica tu energía (1-5 estrellas) y agrega notas si quieres.
              </Item>
              <Item titulo="Tu racha">
                Si entrenas días consecutivos, ves un contador con un ícono de fuego en tu home. La racha no se rompe si todavía no entrenas hoy.
              </Item>
              <Callout tipo="tip">
                Si tu coach asigna una nueva rutina, la anterior se archiva pero el historial queda. La nueva es la que verás activa.
              </Callout>
            </Seccion>

            <Seccion
              id="alimentacion"
              numero={3}
              icono={UtensilsCrossed}
              titulo="Tu plan alimenticio"
              resumen="Tu plan de comidas con horarios, descripciones y macros."
            >
              <Item titulo="Vista por días">
                En <strong>Mi alimentación</strong>, tabs por día. Cada comida tiene: momento del día (desayuno, almuerzo, etc.), hora sugerida, descripción y macros.
              </Item>
              <Item titulo="Marcar comidas cumplidas">
                Toca el círculo a la izquierda de cada comida para marcarla como cumplida. Solo en el día de hoy. Te ayuda a llevar registro.
              </Item>
              <Item titulo="Resumen del día">
                Arriba ves la suma de kcal, proteínas, carbos y grasas del día con una barra de proporciones.
              </Item>
              <Item titulo="Días libres">
                Si tu coach marca un día como "libre", verás un mensaje claro — puedes comer con flexibilidad ese día.
              </Item>
            </Seccion>

            <Seccion
              id="progreso"
              numero={4}
              icono={TrendingUp}
              titulo="Tu progreso"
              resumen="Aquí ves cómo evolucionas semana a semana. Los datos los registra tu coach — tú los visualizas."
            >
              <Item titulo="Historial de mediciones">
                Cada vez que tu coach toma medidas (peso, cintura, % grasa, etc.), aparecen en tu panel <strong>Mi progreso</strong>.
              </Item>
              <Item titulo="Gráficas">
                Si tu coach tiene plan Inicial, ves gráficas de evolución por cada medida. Te ayudan a visualizar tendencias.
              </Item>
              <Callout tipo="info">
                <strong>Importante:</strong> tú no puedes editar tus mediciones. Eso es responsabilidad de tu coach para mantener la calidad de los datos.
              </Callout>
            </Seccion>

            <Seccion
              id="agenda"
              numero={5}
              icono={Calendar}
              titulo="Tu agenda"
              resumen="Las citas que tu coach agendó contigo: presenciales u online."
            >
              <Item titulo="Próximas citas">
                En <strong>Mi agenda</strong> ves todas las citas con tu coach: fecha, hora, modalidad y estado.
              </Item>
              <Item titulo="Citas online con Google Meet">
                Si la cita es online y tu coach tiene plan Inicial, hay un botón "Unirse a Meet" que abre la videollamada directamente en tu navegador.
              </Item>
              <Item titulo="Notificaciones">
                Recibes recordatorios in-app (y en el futuro por email) antes de cada cita.
              </Item>
            </Seccion>

            <Seccion
              id="contactar"
              numero={6}
              icono={MessageCircle}
              titulo="Contactar a tu coach"
              resumen="Tienes un botón directo a WhatsApp o email en tu panel."
            >
              <Item titulo="Botón Contactar">
                En el sidebar (desktop) y en el topbar (mobile) ves los datos de tu coach y un botón "Contactar".
              </Item>
              <Item titulo="WhatsApp si tu coach lo configuró">
                El link abre WhatsApp directamente con el número de tu coach. Si no tiene número configurado, abre el email.
              </Item>
            </Seccion>

            <Seccion
              id="perfil"
              numero={7}
              icono={User}
              titulo="Tu perfil"
              resumen="Lo que sí puedes editar."
            >
              <Item titulo="Cambiar contraseña">
                En <strong>Mi perfil → Cambiar contraseña</strong>. Necesitas tu contraseña actual.
              </Item>
              <Item titulo="Datos personales">
                Puedes editar tu nombre, apellido y teléfono.
              </Item>
              <Item titulo="Modo claro / oscuro">
                Toggle del tema en el topbar. Se guarda en tu navegador.
              </Item>
            </Seccion>

            <Seccion
              id="limites"
              numero={8}
              icono={Shield}
              titulo="Lo que puedes y no puedes hacer"
              resumen="ProFit Manager está diseñado para que tu coach controle la calidad de tus datos."
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div
                  className="rounded-xl p-4"
                  style={{ background: "var(--green-bg)", border: "1px solid color-mix(in srgb, var(--green) 30%, transparent)" }}
                >
                  <p className="text-sm font-bold mb-3" style={{ color: "var(--green)" }}>✓ Sí puedes</p>
                  <ul className="text-sm space-y-1.5" style={{ color: "var(--foreground)" }}>
                    <li>• Ver tu rutina y plan alimenticio</li>
                    <li>• Marcar check-ins de entrenamientos</li>
                    <li>• Marcar comidas como cumplidas</li>
                    <li>• Ver tu progreso e historial</li>
                    <li>• Contactar a tu coach</li>
                    <li>• Editar tu contraseña y datos básicos</li>
                  </ul>
                </div>
                <div
                  className="rounded-xl p-4"
                  style={{ background: "var(--red-bg)", border: "1px solid color-mix(in srgb, var(--red) 30%, transparent)" }}
                >
                  <p className="text-sm font-bold mb-3" style={{ color: "var(--red)" }}>✗ No puedes</p>
                  <ul className="text-sm space-y-1.5" style={{ color: "var(--foreground)" }}>
                    <li>• Editar tu rutina ni ejercicios</li>
                    <li>• Editar tu plan alimenticio</li>
                    <li>• Editar tu peso ni mediciones</li>
                    <li>• Crear o editar citas</li>
                    <li>• Cambiar de coach</li>
                    <li>• Ver datos de otros alumnos</li>
                  </ul>
                </div>
              </div>
              <Callout tipo="info">
                Si necesitas que tu coach ajuste algo, contáctalo directamente. Es parte del acompañamiento personalizado.
              </Callout>
            </Seccion>

            {/* CTA final */}
            <div
              className="rounded-2xl p-8 text-center mt-10"
              style={{ background: "linear-gradient(135deg, var(--orange-bg), var(--blue-bg))" }}
            >
              <h3 className="text-2xl font-extrabold mb-2" style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}>
                ¿Ya tienes tu cuenta?
              </h3>
              <p className="text-sm mb-6" style={{ color: "var(--foreground-muted)" }}>
                Ingresa con el email que te dio tu coach.
              </p>
              <Link href="/login" className="btn-primary px-7 py-3.5 text-base">
                Iniciar sesión <ChevronRight size={18} />
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
