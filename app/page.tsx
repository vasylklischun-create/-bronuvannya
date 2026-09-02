import Link from "next/link"
import { CalendarRange, ShieldCheck } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { BookingCalendar } from "@/components/booking-calendar"
import type { Booking } from "@/lib/bookings"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("bookings")
    .select("id, name, phone, start_date, end_date, status, created_at")
    .order("created_at", { ascending: false })

  const bookings = (data ?? []) as Booking[]

  return (
    <main className="min-h-svh">
      <header className="border-b border-border/60 bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CalendarRange className="size-5" />
            </span>
            <span className="font-heading text-lg font-semibold">Календар бронювання</span>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin" className="gap-2">
              <ShieldCheck className="size-4" />
              <span className="hidden sm:inline">Адмін-панель</span>
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-12">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl md:text-5xl">
            Забронюйте зручні для вас дати
          </h1>
          <p className="mt-3 text-base text-muted-foreground text-pretty sm:text-lg">
            Оберіть діапазон дат у календарі, залиште контакти — і ми підтвердимо ваше бронювання.
          </p>
        </div>

        <BookingCalendar initialBookings={bookings} />
      </section>

      <footer className="mx-auto max-w-5xl px-4 py-8 text-center text-sm text-muted-foreground sm:px-6">
        Заявки обробляються адміністратором. Підтверджені дати стають недоступними для інших.
      </footer>
    </main>
  )
}
