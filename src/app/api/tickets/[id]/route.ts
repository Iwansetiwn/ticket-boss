import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { ownerId: true },
    })

    const canDelete = ticket && (!ticket.ownerId || ticket.ownerId === user.id)
    if (!canDelete) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.ticket.delete({ where: { id } })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: unknown) {
    console.error("delete ticket error:", err)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
