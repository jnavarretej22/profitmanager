import { auth } from "./auth"
import { errorResponse } from "./plan-guard"

// Obtiene el alumno autenticado o retorna error.
// Solo el alumno puede escribir sus propios logs (sesiones, comidas).
export async function getAlumnoAutenticado() {
  const session = await auth()
  if (!session || session.user.role !== "alumno" || !session.user.alumnoId) {
    return { alumno: null, error: errorResponse("NO_AUTORIZADO", "No autorizado", 401) }
  }
  return { alumno: { id: session.user.alumnoId }, error: null }
}
