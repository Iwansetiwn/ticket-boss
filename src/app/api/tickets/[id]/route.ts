import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { getSupportInboxLink } from "@/lib/supportInbox"

const STATUS_WHITELIST = new Set(["Open", "Pending", "In progress", "Awaiting Response", "Resolved", "Closed"])

const normalizeString = (value: unknown) => {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  if (value === null) return null
  return undefined
}

async function ensureOwnership(id: string, userId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: { ownerId: true },
  })

  const canMutate = ticket && (!ticket.ownerId || ticket.ownerId === userId)
  return canMutate
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
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
    })

    if (!ticket || (ticket.ownerId && ticket.ownerId !== user.id)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const serialized = {
      ...ticket,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
    }

    return NextResponse.json({ ticket: serialized })
  } catch (err) {
    console.error("fetch ticket error:", err)
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}

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
    const canMutate = await ensureOwnership(id, user.id)
    if (!canMutate) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.ticket.delete({ where: { id } })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: unknown) {
    console.error("delete ticket error:", err)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  try {
    const canMutate = await ensureOwnership(id, user.id)
    if (!canMutate) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    const clientName = normalizeString(payload.clientName)
    const brand = normalizeString(payload.brand)
    const subject = normalizeString(payload.subject)
    const status = normalizeString(payload.status)
    const issueCategory = normalizeString(payload.issueCategory)
    const ticketUrl = normalizeString(payload.ticketUrl)
    const resolvedTicketUrl =
      ticketUrl === undefined ? undefined : ticketUrl ?? getSupportInboxLink(id)

    if (clientName !== undefined) data.clientName = clientName ?? "Unknown"
    if (brand !== undefined) data.brand = brand ?? "Unknown"
    if (subject !== undefined) data.subject = subject ?? "Untitled"
    if (status !== undefined) {
      const nextStatus = status ?? "Open"
      if (!STATUS_WHITELIST.has(nextStatus)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 })
      }
      data.status = nextStatus
    }
    if (issueCategory !== undefined) data.issueCategory = issueCategory ?? "Uncategorized"
    if (resolvedTicketUrl !== undefined) data.ticketUrl = resolvedTicketUrl

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No updates supplied" }, { status: 400 })
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data,
    })

    return NextResponse.json({ success: true, ticket })
  } catch (err) {
    console.error("update ticket error:", err)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}
