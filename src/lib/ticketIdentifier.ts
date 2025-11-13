import { DASHBOARD_TIMEZONE_OFFSET_MINUTES } from "@/lib/timezone"

const DAILY_SUFFIX_DELIMITER = "__day__"
const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/
const MS_PER_MINUTE = 60 * 1000
const MS_PER_DAY = 24 * 60 * 60 * 1000

function applyOffset(date: Date, offsetMinutes: number) {
  return new Date(date.getTime() + offsetMinutes * MS_PER_MINUTE)
}

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

export function getTicketDayKey(date: Date, offsetMinutes = DASHBOARD_TIMEZONE_OFFSET_MINUTES) {
  const zonedDate = applyOffset(date, offsetMinutes)
  return zonedDate.toISOString().slice(0, 10)
}

export function buildDailyTicketId(baseId: string, date: Date) {
  const normalized = baseId.trim()
  const dayKey = getTicketDayKey(date)
  return `${normalized}${DAILY_SUFFIX_DELIMITER}${dayKey}`
}

export function getUtcDayBounds(date: Date, offsetMinutes = DASHBOARD_TIMEZONE_OFFSET_MINUTES) {
  const zonedDate = applyOffset(date, offsetMinutes)
  const startLocalUtc = Date.UTC(
    zonedDate.getUTCFullYear(),
    zonedDate.getUTCMonth(),
    zonedDate.getUTCDate()
  )
  const start = new Date(startLocalUtc - offsetMinutes * MS_PER_MINUTE)
  const end = new Date(start.getTime() + MS_PER_DAY)
  return { start, end }
}
