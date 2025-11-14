import { NextResponse } from "next/server"

import { Prisma } from "@prisma/client"

import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { getSupportInboxLink } from "@/lib/supportInbox"

type RestoreTicketPayload = {
  id: string
  brand: string | null
  clientName: string | null
  subject: string | null
  product: string | null
  issueCategory: string | null
  ticketUrl: string | null
  status: string | null
  lastMessage: string | null
  date: string | null
  clientMsgs: unknown
  agentMsgs: unknown
  ownerId: string | null
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let payload: { ticket?: RestoreTicketPayload }
  try {
    payload = (await req.json()) as { ticket?: RestoreTicketPayload }
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const ticket = payload.ticket
  if (!ticket || typeof ticket.id !== "string") {
    return NextResponse.json({ error: "Missing ticket" }, { status: 400 })
  }

  if (ticket.ownerId && ticket.ownerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const ownerId = ticket.ownerId ?? user.id

const toJsonInput = (
  value: unknown
): Prisma.InputJsonValue | typeof Prisma.JsonNull => {
  if (value === null || value === undefined) {
    return Prisma.JsonNull
  }
  return value as Prisma.InputJsonValue
}

  try {
    const restored = await prisma.ticket.create({
      data: {
        id: ticket.id,
        brand: (ticket.brand && ticket.brand.trim()) || "Unknown",
        clientName: (ticket.clientName && ticket.clientName.trim()) || "Unknown",
        subject: (ticket.subject && ticket.subject.trim()) || "Untitled",
        product: ticket.product?.trim() || null,
        issueCategory: ticket.issueCategory?.trim() || null,
        ticketUrl: ticket.ticketUrl?.trim() || getSupportInboxLink(ticket.id),
        status: ticket.status?.trim() || "Open",
        lastMessage: ticket.lastMessage ?? "",
        date: ticket.date ?? null,
        clientMsgs: toJsonInput(ticket.clientMsgs),
        agentMsgs: toJsonInput(ticket.agentMsgs),
        ownerId,
      },
    })

    const serialized = {
      ...restored,
      createdAt: restored.createdAt.toISOString(),
      updatedAt: restored.updatedAt.toISOString(),
    }

    return NextResponse.json({ success: true, ticket: serialized })
  } catch (err) {
    console.error("restore ticket error:", err)
    return NextResponse.json({ error: "Failed to restore ticket" }, { status: 500 })
  }
}
