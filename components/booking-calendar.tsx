"use client"

import { useMemo, useState } from "react"
import type { DateRange } from "react-day-picker"
import { toast } from "sonner"
import { CalendarCheck, Loader2, Phone, User, CalendarDays } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  type Booking,
  getBlockedDates,
  rangeOverlapsApproved,
  toISODate,
  fromISODate,
  formatRange,
  nights,
} from "@/lib/bookings"

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function BookingCalendar({ initialBookings }: { initialBookings: Booking[] }) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [range, setRange] = useState<DateRange | undefined>()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const blockedDates = useMemo(() => getBlockedDates(bookings), [bookings])

  const disabledMatcher = useMemo(
    () => [{ before: today }, ...blockedDates.map((d) => ({ from: d, to: d }))],
    [today, blockedDates],
  )

  const selectionValid = useMemo(() => {
    if (!range?.from || !range?.to) return false
    const startISO = toISODate(range.from)
    const endISO = toISODate(range.to)
    return !rangeOverlapsApproved(startISO, endISO, bookings)
  }, [range, bookings])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!range?.from || !range?.to) {
      toast.error("Оберіть діапазон дат у календарі")
      return
    }
    if (!name.trim()) {
      toast.error("Введіть ваше ім'я")
      return
    }
    if (phone.trim().length < 7) {
      toast.error("Введіть коректний номер телефону")
      return
    }

    const startISO = toISODate(range.from)
    const endISO = toISODate(range.to)

    if (rangeOverlapsApproved(startISO, endISO, bookings)) {
      toast.error("Ці дати вже заброньовані. Оберіть інший діапазон.")
      return
    }

    setSubmitting(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("bookings")
      .insert({ name: name.trim(), phone: phone.trim(), start_date: startISO, end_date: endISO, status: "pending" })
      .select()
      .single()

    setSubmitting(false)

    if (error) {
      toast.error("Не вдалося надіслати заявку. Спробуйте ще раз.")
      return
    }

    setBookings((prev) => [data as Booking, ...prev])
    setRange(undefined)
    setName("")
    setPhone("")
    toast.success("Заявку надіслано! Статус: Очікує підтвердження.")
  }

  const rangeLabel =
    range?.from && range?.to
      ? formatRange(toISODate(range.from), toISODate(range.to))
      : range?.from
        ? `${formatRange(toISODate(range.from), toISODate(range.from))} — оберіть дату завершення`
        : "Дати не обрано"

  const nightCount = range?.from && range?.to ? nights(toISODate(range.from), toISODate(range.to)) : 0

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-xl">
            <CalendarDays className="size-5 text-primary" />
            Оберіть діапазон дат
          </CardTitle>
          <CardDescription>Натисніть на дату заїзду, потім на дату виїзду. Зайняті дати недоступні.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            disabled={disabledMatcher}
            numberOfMonths={1}
            showOutsideDays={false}
            className="rounded-lg border bg-card p-3"
            modifiers={{ booked: blockedDates }}
            modifiersClassNames={{
              booked: "line-through opacity-60",
            }}
          />
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-primary" />
              Обрано
            </span>
            <span className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-muted line-through" />
              Заброньовано
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-xl">
            <CalendarCheck className="size-5 text-primary" />
            Ваша заявка
          </CardTitle>
          <CardDescription>Заповніть контактні дані для підтвердження бронювання.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-5 rounded-lg border border-primary/20 bg-accent/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Обраний період</p>
            <p className="mt-1 font-heading text-lg font-semibold text-foreground text-balance">{rangeLabel}</p>
            {nightCount > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                {nightCount} {nightCount === 1 ? "ніч" : nightCount < 5 ? "ночі" : "ночей"}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Ім&apos;я</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ваше ім'я"
                  className="pl-9"
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Номер телефону</Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+380 XX XXX XX XX"
                  className="pl-9"
                  autoComplete="tel"
                  inputMode="tel"
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="mt-1 w-full" disabled={submitting || !selectionValid}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Надсилання...
                </>
              ) : (
                "Надіслати заявку"
              )}
            </Button>
            {!selectionValid && range?.from && range?.to && (
              <p className="text-center text-sm text-destructive">Обраний період перетинається з підтвердженим бронюванням.</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
