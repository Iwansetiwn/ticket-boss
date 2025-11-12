const DAILY_SUFFIX_DELIMITER = "__day__"
const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/

export function stripDailyTicketSuffix(ticketId: string) {
  if (!ticketId) return ticketId
  const trimmed = ticketId.trim()
  const marker = trimmed.lastIndexOf(DAILY_SUFFIX_DELIMITER)
  if (marker === -1) {
    return trimmed
  }
  const suffix = trimmed.slice(marker + DAILY_SUFFIX_DELIMITER.length)
  if (DATE_KEY_REGEX.test(suffix)) {
    return trimmed.slice(0, marker)
  }
  return trimmed
}

export function resolveReferenceDate(raw?: string | null) {
  if (raw) {
    const parsed = new Date(raw)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }
  return new Date()
}

export function getTicketDayKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function buildDailyTicketId(baseId: string, date: Date) {
  const normalized = baseId.trim()
  const dayKey = getTicketDayKey(date)
  return `${normalized}${DAILY_SUFFIX_DELIMITER}${dayKey}`
}

export function getUtcDayBounds(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)
  return { start, end }
}
