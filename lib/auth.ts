import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { prisma } from "./db"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Sin adapter: Credentials requiere estrategia JWT, no database sessions
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const user = await prisma.user.findFirst({
          where: { email: email.toLowerCase(), deleted_at: null, activo: true },
          include: {
            coach: { select: { id: true, estado_plan: true, plan_actual: true } },
            alumno: { select: { id: true } },
          },
        })

        if (!user || !user.activo) return null

        // Si no tiene password_hash, la cuenta fue creada por el coach y aún no
        // pasó por el flujo de primer acceso. El form de login debió detectarlo
        // vía /api/auth/check-email y forzar el setup antes de intentar login.
        if (!user.password_hash) return null

        const passwordOk = await bcrypt.compare(password, user.password_hash)
        if (!passwordOk) return null

        // Actualizar último login
        await prisma.user.update({
          where: { id: user.id },
          data: { ultimo_login: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: `${user.nombre} ${user.apellido}`,
          role: user.role,
          coachId: user.coach?.id ?? null,
          alumnoId: user.alumno?.id ?? null,
          coachEstadoPlan: user.coach?.estado_plan ?? null,
          coachPlan: user.coach?.plan_actual ?? null,
        }
      },
    }),
  ],
  callbacks: {
    // jwt: persiste datos del usuario en el token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.coachId = user.coachId
        token.alumnoId = user.alumnoId
        token.coachEstadoPlan = user.coachEstadoPlan
        token.coachPlan = user.coachPlan
      }
      return token
    },
    // session: expone datos del token a la UI y Server Components
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as "admin" | "coach" | "alumno"
      if (token.coachId) session.user.coachId = token.coachId as string
      if (token.alumnoId) session.user.alumnoId = token.alumnoId as string
      session.user.coachEstadoPlan = (token.coachEstadoPlan as string) ?? null
      session.user.coachPlan = (token.coachPlan as string) ?? null
      return session
    },
  },
})

// Tipado de la sesión extendida
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: "admin" | "coach" | "alumno"
      coachId?: string
      alumnoId?: string
      coachEstadoPlan?: string | null
      coachPlan?: string | null
    }
  }

  interface User {
    role: "admin" | "coach" | "alumno"
    coachId: string | null
    alumnoId: string | null
    coachEstadoPlan: string | null
    coachPlan: string | null
  }
}
