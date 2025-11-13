import { Prisma } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSupportInboxLink } from "@/lib/supportInbox"
import { buildDailyTicketId, getTicketDayKey, getUtcDayBounds, resolveReferenceDate } from "@/lib/ticketIdentifier"

function normalizeNotificationMessage(subject: string, clientName: string, body?: string) {
  const condensed = body?.replace(/\s+/g, " ").trim()
  const fallback = `New activity on ${subject || "a ticket"} for ${clientName || "a client"}.`
  return (condensed && condensed.length > 0 ? condensed : fallback).slice(0, 280)
}

const allowedOrigins =
  process.env.TICKET_API_ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? []

function isOriginAllowed(origin: string | null) {
  if (allowedOrigins.length === 0) return true
  if (!origin) return true
  return allowedOrigins.includes(origin)
}

// Apply CORS headers while respecting the allowlist (defaults to open if unset)
function withCors(req: NextRequest | null, res: NextResponse) {
  const origin = req?.headers.get("origin") ?? null
  if (isOriginAllowed(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin ?? "*")
  }
  res.headers.set("Vary", "Origin")
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  return res
}

function unauthorized(req: NextRequest) {
  return withCors(req, NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
}

function validateToken(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  const validToken = process.env.DASHBOARD_TOKEN
  return Boolean(token && validToken && token === validToken)
}

// Handle preflight
export async function OPTIONS(req: NextRequest) {
  if (!isOriginAllowed(req.headers.get("origin"))) {
    return withCors(req, NextResponse.json({ error: "Origin not allowed" }, { status: 403 }))
  }
  return withCors(req, new NextResponse(null, { status: 204 }))
}

// POST: receives data from your Chrome extension
type TicketPayload = {
  id: string
  brand: string
  clientName?: string
  subject?: string
  product?: string
  issueCategory?: string
  ticketUrl?: string
  status?: string
  lastMessage?: string
  date?: string
  clientMsgs?: Prisma.InputJsonValue
  agentMsgs?: Prisma.InputJsonValue
  ownerEmail?: string
  ownerId?: string
}

export async function POST(req: NextRequest) {
  if (!validateToken(req)) {
    return unauthorized(req)
  }

  try {
    const body = (await req.json()) as TicketPayload

    if (!body.id || !body.brand) {
      return withCors(req, NextResponse.json({ error: "Missing required fields" }, { status: 400 }))
    }

    const baseTicketId = body.id.trim()
    const clientName = body.clientName?.trim() || "Unknown"
    const subject = body.subject?.trim() || "Untitled"
    const lastMessage = body.lastMessage ?? ""
    let ownerId: string | undefined

    if (body.ownerId) {
      ownerId = body.ownerId
    } else if (body.ownerEmail) {
      const owner = await prisma.user.findUnique({
        where: { email: body.ownerEmail.toLowerCase().trim() },
        select: { id: true },
      })
      ownerId = owner?.id
    }

    const issueCategory = body.issueCategory?.trim() || null
    const ticketUrl = body.ticketUrl?.trim() || null
    const normalizedTicketUrl = ticketUrl || getSupportInboxLink(baseTicketId)

    const referenceDate = resolveReferenceDate(body.date)
    const dayKey = getTicketDayKey(referenceDate)
    const dailyTicketId = buildDailyTicketId(baseTicketId, referenceDate)
    const { start, end } = getUtcDayBounds(referenceDate)

    const existingTicket = await prisma.ticket.findFirst({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
        OR: [{ id: baseTicketId }, { id: dailyTicketId }],
      },
      orderBy: { createdAt: "desc" },
    })

    const ticketData = {
      brand: body.brand,
      clientName,
      subject,
      product: body.product,
      issueCategory,
      ticketUrl: normalizedTicketUrl,
      status: body.status,
      lastMessage,
      date: dayKey,
      clientMsgs: body.clientMsgs,
      agentMsgs: body.agentMsgs,
      ...(ownerId ? { ownerId } : {}),
    }

    const ticket = existingTicket
      ? await prisma.ticket.update({
          where: { id: existingTicket.id },
          data: ticketData,
        })
      : await prisma.ticket.create({
          data: {
            id: dailyTicketId,
            ...ticketData,
          },
        })

    const ticketOwnerId = ticket.ownerId ?? ownerId
    if (ticketOwnerId) {
      try {
        await prisma.notification.create({
          data: {
            ticketId: ticket.id,
            userId: ticketOwnerId,
            message: normalizeNotificationMessage(subject, clientName, lastMessage || undefined),
          },
        })
      } catch (notificationError) {
        console.error("Failed to record notification", notificationError)
      }
    }

    return withCors(req, NextResponse.json({ success: true, ticket }))
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process request"
    return withCors(req, NextResponse.json({ error: message }, { status: 500 }))
  }
}

// GET remains available for trusted callers but now also requires the bearer token
export async function GET(req: NextRequest) {
  if (!validateToken(req)) {
    return unauthorized(req)
  }

  const tickets = await prisma.ticket.findMany({ orderBy: { updatedAt: "desc" } })
  return withCors(req, NextResponse.json(tickets))
}
