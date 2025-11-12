import { stripDailyTicketSuffix } from "./ticketIdentifier"

export function getSupportInboxLink(ticketId: string) {
  const base =
    process.env.NEXT_PUBLIC_WORLDHOST_SUPPORT_INBOX_URL ??
    "https://admin.worldhost.group/admin/support/inbox"
  const normalizedTicketId = stripDailyTicketSuffix(ticketId)
  return `${base.replace(/\/$/, "")}/${normalizedTicketId}`
}
