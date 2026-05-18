import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function DELETE() {
  const session = await auth()
  if (!session || session.user.role !== "coach" || !session.user.coachId) {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  await prisma.coach.update({
    where: { id: session.user.coachId },
    data: { google_calendar_token: null },
  })

  return NextResponse.json({ ok: true })
}
