import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { PerfilAlumnoForm } from "./PerfilAlumnoForm"

export default async function PerfilAlumnoPage() {
  const session = await auth()
  if (!session?.user.alumnoId) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      nombre: true, apellido: true, email: true,
      telefono: true, zona_horaria: true,
      alumno: {
        select: {
          altura_cm: true, peso_inicial_kg: true,
          objetivo: true, notas_medicas: true,
          genero: true, fecha_nacimiento: true,
        },
      },
    },
  })

  if (!user || !user.alumno) redirect("/login")

  return (
    <div className="space-y-5 animate-fade-in max-w-xl">
      <div>
        <h1 className="section-title">Mi perfil</h1>
        <p className="section-subtitle">Gestiona tu información personal</p>
      </div>

      <PerfilAlumnoForm
        nombre={user.nombre}
        apellido={user.apellido}
        email={user.email}
        telefono={user.telefono ?? ""}
        zona_horaria={user.zona_horaria ?? "America/Guayaquil"}
        // datos físicos: solo lectura
        altura_cm={user.alumno.altura_cm}
        peso_inicial_kg={user.alumno.peso_inicial_kg ? Number(user.alumno.peso_inicial_kg) : null}
        objetivo={user.alumno.objetivo}
        notas_medicas={user.alumno.notas_medicas}
        genero={user.alumno.genero}
        fecha_nacimiento={user.alumno.fecha_nacimiento?.toISOString().split("T")[0] ?? null}
      />
    </div>
  )
}
