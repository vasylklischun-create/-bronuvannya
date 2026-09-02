"use client"

import { useState } from "react"
import Link from "next/link"
import { ShieldCheck, Loader2, ArrowLeft, MailCheck } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AdminSignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError("Пароль має містити щонайменше 6 символів.")
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
        data: { is_admin: true },
      },
    })

    setLoading(false)

    if (error) {
      if (error.message.toLowerCase().includes("already")) {
        setError("Такий акаунт уже існує. Перейдіть до входу.")
      } else if (error.message.toLowerCase().includes("weak") || error.message.toLowerCase().includes("password")) {
        setError("Пароль занадто слабкий. Використайте складніший пароль.")
      } else {
        setError("Не вдалося створити акаунт. Спробуйте ще раз.")
      }
      return
    }

    setDone(true)
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <Link
          href="/admin/login"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          До входу
        </Link>

        <Card className="border-border/70 shadow-sm">
          {done ? (
            <>
              <CardHeader className="text-center">
                <span className="mx-auto mb-2 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <MailCheck className="size-6" />
                </span>
                <CardTitle className="font-heading text-xl">Підтвердіть пошту</CardTitle>
                <CardDescription>
                  Ми надіслали лист на <span className="font-medium text-foreground">{email}</span>. Перейдіть за
                  посиланням у листі, щоб активувати акаунт, потім увійдіть.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild size="lg" className="w-full">
                  <Link href="/admin/login">Перейти до входу</Link>
                </Button>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center">
                <span className="mx-auto mb-2 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <ShieldCheck className="size-6" />
                </span>
                <CardTitle className="font-heading text-xl">Реєстрація адміністратора</CardTitle>
                <CardDescription>Створіть обліковий запис для керування заявками.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email">Електронна пошта</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="password">Пароль</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Щонайменше 6 символів"
                      autoComplete="new-password"
                      required
                    />
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <Button type="submit" size="lg" className="mt-1 w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Створення...
                      </>
                    ) : (
                      "Створити акаунт"
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </main>
  )
}
