export type BookingStatus = "pending" | "approved" | "rejected"

export interface Booking {
  id: string
  name: string
  phone: string
  start_date: string // ISO date (yyyy-mm-dd)
  end_date: string // ISO date (yyyy-mm-dd)
  status: BookingStatus
  created_at: string
}

const MONTHS_UK = [
  "січня",
  "лютого",
  "березня",
  "квітня",
  "травня",
  "червня",
  "липня",
  "серпня",
  "вересня",
  "жовтня",
  "листопада",
  "грудня",
]

/** Format a Date as a local yyyy-mm-dd string (no timezone shift). */
export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Parse a yyyy-mm-dd string as a local Date. */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

/** "5 вересня" */
export function formatDayMonth(date: Date): string {
  return `${date.getDate()} ${MONTHS_UK[date.getMonth()]}`
}

/** "5–6 вересня 2026" or full when months differ. */
export function formatRange(startISO: string, endISO: string): string {
  const start = fromISODate(startISO)
  const end = fromISODate(endISO)
  const year = end.getFullYear()

  if (startISO === endISO) {
    return `${formatDayMonth(start)} ${year}`
  }
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()}–${end.getDate()} ${MONTHS_UK[end.getMonth()]} ${year}`
  }
  return `${formatDayMonth(start)} – ${formatDayMonth(end)} ${year}`
}

/** Number of nights in a range. */
export function nights(startISO: string, endISO: string): number {
  const ms = fromISODate(endISO).getTime() - fromISODate(startISO).getTime()
  return Math.max(0, Math.round(ms / 86_400_000))
}

/** All dates (inclusive) that are blocked because they belong to approved bookings. */
export function getBlockedDates(bookings: Pick<Booking, "start_date" | "end_date" | "status">[]): Date[] {
  const blocked: Date[] = []
  for (const b of bookings) {
    if (b.status !== "approved") continue
    const cursor = fromISODate(b.start_date)
    const end = fromISODate(b.end_date)
    while (cursor <= end) {
      blocked.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
  }
  return blocked
}

/** True if any date in [startISO, endISO] overlaps an approved booking. */
export function rangeOverlapsApproved(
  startISO: string,
  endISO: string,
  bookings: Pick<Booking, "start_date" | "end_date" | "status">[],
): boolean {
  const s = fromISODate(startISO).getTime()
  const e = fromISODate(endISO).getTime()
  return bookings.some((b) => {
    if (b.status !== "approved") return false
    const bs = fromISODate(b.start_date).getTime()
    const be = fromISODate(b.end_date).getTime()
    return s <= be && e >= bs
  })
}

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Очікує підтвердження",
  approved: "Підтверджено",
  rejected: "Відхилено",
}
