import { NextResponse } from "next/server"

import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    include: {
      ticket: {
        select: { subject: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 25,
  })

  return NextResponse.json({
    notifications: notifications.map((notification) => ({
      id: notification.id,
      message: notification.message,
      ticketId: notification.ticketId,
      ticketSubject: notification.ticket?.subject ?? "Ticket update",
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
    })),
  })
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let payload: { ids?: string[] } = {}
  try {
    payload = (await req.json()) as { ids?: string[] }
  } catch {
    // empty payload is fine; fall through to mark all unread
  }

  const ids = Array.isArray(payload.ids) ? payload.ids.filter((id) => typeof id === "string") : []

  const where =
    ids.length > 0
      ? { userId: user.id, id: { in: ids } }
      : {
          userId: user.id,
          isRead: false,
        }

  await prisma.notification.updateMany({
    where,
    data: { isRead: true },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let payload: { ids?: string[] } = {}
  try {
    payload = (await req.json()) as { ids?: string[] }
  } catch {
    // allow empty body
  }

  const ids = Array.isArray(payload.ids) ? payload.ids.filter((id) => typeof id === "string") : []

  const where = ids.length > 0 ? { userId: user.id, id: { in: ids } } : { userId: user.id }

  await prisma.notification.deleteMany({ where })

  return NextResponse.json({ success: true })
}
