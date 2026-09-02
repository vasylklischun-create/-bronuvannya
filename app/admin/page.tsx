import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { AdminDashboard } from "@/components/admin-dashboard"
import type { Booking } from "@/lib/bookings"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  const { data } = await supabase
    .from("bookings")
    .select("id, name, phone, start_date, end_date, status, created_at")
    .order("created_at", { ascending: false })

  const bookings = (data ?? []) as Booking[]

  return <AdminDashboard initialBookings={bookings} adminEmail={user.email ?? ""} />
}
