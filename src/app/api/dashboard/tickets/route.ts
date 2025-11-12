import { NextResponse } from "next/server"

import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const tickets = await prisma.ticket.findMany({
    where: {
      OR: [{ ownerId: user.id }, { ownerId: null }],
    },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json({
    tickets: tickets.map((ticket) => ({
      id: ticket.id,
      clientName: ticket.clientName ?? null,
      brand: ticket.brand ?? null,
      subject: ticket.subject ?? null,
      product: ticket.product ?? null,
      issueCategory: ticket.issueCategory ?? null,
      ticketUrl: ticket.ticketUrl ?? null,
      status: ticket.status ?? null,
      updatedAt: ticket.updatedAt.toISOString(),
    })),
  })
}
