"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Check, X, LogOut, CalendarRange, Phone, User, Clock, Loader2, Inbox } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  type Booking,
  type BookingStatus,
  STATUS_LABELS,
  formatRange,
  nights,
  rangeOverlapsApproved,
} from "@/lib/bookings"

type Filter = "all" | BookingStatus

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  approved: "bg-primary/15 text-primary border-primary/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
}

export function AdminDashboard({
  initialBookings,
  adminEmail,
}: {
  initialBookings: Booking[]
  adminEmail: string
}) {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [filter, setFilter] = useState<Filter>("all")
  const [pendingId, setPendingId] = useState<string | null>(null)

  const counts = useMemo(
    () => ({
      all: bookings.length,
      pending: bookings.filter((b) => b.status === "pending").length,
      approved: bookings.filter((b) => b.status === "approved").length,
      rejected: bookings.filter((b) => b.status === "rejected").length,
    }),
    [bookings],
  )

  const filtered = useMemo(
    () => (filter === "all" ? bookings : bookings.filter((b) => b.status === filter)),
    [bookings, filter],
  )

  async function updateStatus(booking: Booking, status: BookingStatus) {
    // Guard: don't approve a range that clashes with an already-approved booking.
    if (status === "approved") {
      const others = bookings.filter((b) => b.id !== booking.id)
      if (rangeOverlapsApproved(booking.start_date, booking.end_date, others)) {
        toast.error("Ці дати перетинаються з іншим підтвердженим бронюванням.")
        return
      }
    }

    setPendingId(booking.id)
    const supabase = createClient()
    const { error } = await supabase.from("bookings").update({ status }).eq("id", booking.id)
    setPendingId(null)

    if (error) {
      toast.error("Не вдалося оновити статус. Спробуйте ще раз.")
      return
    }

    setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, status } : b)))
    toast.success(status === "approved" ? "Бронювання погоджено." : "Заявку відхилено.")
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/admin/login")
    router.refresh()
  }

  return (
    <main className="min-h-svh">
      <header className="border-b border-border/60 bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CalendarRange className="size-5" />
            </span>
            <div>
              <p className="font-heading text-base font-semibold leading-tight">Адмін-панель</p>
              <p className="text-xs text-muted-foreground">{adminEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">На сайт</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Вийти</span>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Усього" value={counts.all} />
          <StatCard label="Очікують" value={counts.pending} accent="chart-2" />
          <StatCard label="Погоджено" value={counts.approved} accent="primary" />
          <StatCard label="Відхилено" value={counts.rejected} accent="destructive" />
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList className="mb-5 w-full justify-start overflow-x-auto">
            <TabsTrigger value="all">Усі</TabsTrigger>
            <TabsTrigger value="pending">Очікують</TabsTrigger>
            <TabsTrigger value="approved">Погоджені</TabsTrigger>
            <TabsTrigger value="rejected">Відхилені</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-0">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
                <Inbox className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Заявок немає</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.map((b) => (
                  <BookingRow
                    key={b.id}
                    booking={b}
                    busy={pendingId === b.id}
                    onApprove={() => updateStatus(b, "approved")}
                    onReject={() => updateStatus(b, "rejected")}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </main>
  )
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: "primary" | "chart-2" | "destructive"
}) {
  const accentClass =
    accent === "primary"
      ? "text-primary"
      : accent === "chart-2"
        ? "text-chart-2"
        : accent === "destructive"
          ? "text-destructive"
          : "text-foreground"
  return (
    <Card className="border-border/70">
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`mt-1 font-heading text-2xl font-bold ${accentClass}`}>{value}</p>
      </CardContent>
    </Card>
  )
}

function BookingRow({
  booking,
  busy,
  onApprove,
  onReject,
}: {
  booking: Booking
  busy: boolean
  onApprove: () => void
  onReject: () => void
}) {
  const nightCount = nights(booking.start_date, booking.end_date)
  return (
    <Card className="border-border/70 transition-colors hover:border-border">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1.5 font-heading font-semibold">
              <User className="size-4 text-muted-foreground" />
              {booking.name}
            </span>
            <a
              href={`tel:${booking.phone}`}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <Phone className="size-3.5" />
              {booking.phone}
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="flex items-center gap-1.5 font-medium">
              <CalendarRange className="size-4 text-primary" />
              {formatRange(booking.start_date, booking.end_date)}
            </span>
            <span className="text-muted-foreground">
              · {nightCount} {nightCount === 1 ? "ніч" : nightCount < 5 ? "ночі" : "ночей"}
            </span>
          </div>
          <Badge variant="outline" className={`w-fit gap-1.5 ${STATUS_STYLES[booking.status]}`}>
            <Clock className="size-3" />
            {STATUS_LABELS[booking.status]}
          </Badge>
        </div>

        {booking.status === "pending" ? (
          <div className="flex shrink-0 gap-2">
            <Button size="sm" onClick={onApprove} disabled={busy} className="gap-1.5">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Погодити
            </Button>
            <Button size="sm" variant="outline" onClick={onReject} disabled={busy} className="gap-1.5">
              <X className="size-4" />
              Відхилити
            </Button>
          </div>
        ) : (
          <div className="flex shrink-0 gap-2">
            {booking.status === "approved" ? (
              <Button size="sm" variant="outline" onClick={onReject} disabled={busy} className="gap-1.5">
                <X className="size-4" />
                Скасувати
              </Button>
            ) : (
              <Button size="sm" onClick={onApprove} disabled={busy} className="gap-1.5">
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Погодити
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
