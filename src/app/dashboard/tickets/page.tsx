import React from "react"
import prisma from "@/lib/prisma"
import TicketCards from "@/components/tickets/TicketCards"
import { getCurrentUser } from "@/lib/auth"

export default async function TicketsPage() {
  const user = await getCurrentUser()
  if (!user) {
    return null
  }

  const tickets = await prisma.ticket.findMany({
    where: {
      OR: [{ ownerId: user.id }, { ownerId: null }],
    },
    orderBy: { updatedAt: "desc" },
  })

  const safe = tickets.map((t) => ({
    id: t.id,
    clientName: t.clientName ?? null,
    brand: t.brand ?? null,
    subject: t.subject ?? null,
    product: t.product ?? null,
    issueCategory: t.issueCategory ?? null,
    ticketUrl: t.ticketUrl ?? null,
    status: t.status ?? null,
    updatedAt: t.updatedAt.toISOString(),
  }))

  return <TicketCards tickets={safe} liveRefreshInterval={15000} />
}
