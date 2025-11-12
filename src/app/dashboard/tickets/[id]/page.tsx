import React from "react"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"

import DeleteTicketButton from "@/components/tickets/DeleteTicketButton"
import TicketEditForm from "@/components/tickets/TicketEditForm"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { getSupportInboxLink } from "@/lib/supportInbox"
import { stripDailyTicketSuffix } from "@/lib/ticketIdentifier"

function statusClasses(status?: string) {
  if (status === "Open") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
  if (status === "Pending") return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
  return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
}

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/signin")
  }

  const { id } = await params

  const ticket = await prisma.ticket.findFirst({
    where: {
      id,
      ownerId: user.id,
    },
  })

  if (!ticket) return notFound()

  const ticketRecord = ticket as Record<string, unknown>
  const extensionData =
    "extensionData" in ticketRecord ? ticketRecord.extensionData : undefined
  const showExtensionData =
    typeof extensionData !== "undefined" && extensionData !== null

  const externalTicketUrl = ticket.ticketUrl ?? getSupportInboxLink(ticket.id)
  const displayTicketId = stripDailyTicketSuffix(ticket.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Ticket #{displayTicketId}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {ticket.subject || "No subject"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/tickets"
            className="rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            Back to tickets
          </Link>

          <Link
            href={externalTicketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            Open ticket ↗
          </Link>

          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${statusClasses(
              ticket.status ?? ""
            )}`}
          >
            {ticket.status ?? "Unknown"}
          </span>

          <DeleteTicketButton id={ticket.id} subject={ticket.subject ?? undefined} />
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 text-sm dark:border-white/[0.05] dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">Ticket link</p>
        <Link
          href={externalTicketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        >
          Open original ↗
        </Link>
      </div>

      <TicketEditForm
        ticket={{
          id: ticket.id,
          clientName: ticket.clientName ?? "",
          brand: ticket.brand ?? "",
          subject: ticket.subject ?? "",
          status: ticket.status ?? "Open",
          issueCategory: ticket.issueCategory ?? "Uncategorized",
          lastUpdated: ticket.updatedAt.toISOString(),
          ticketUrl: ticket.ticketUrl ?? "",
        }}
      />

      {showExtensionData && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            Extension data (raw)
          </h3>
          <pre className="mt-2 max-h-64 overflow-auto rounded bg-gray-50 p-3 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-200">
            {JSON.stringify(extensionData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
