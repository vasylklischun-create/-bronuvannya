"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ShieldCheck, Loader2, ArrowLeft } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setLoading(false)
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setError("Електронну пошту не підтверджено. Перевірте поштову скриньку.")
      } else if (error.message.toLowerCase().includes("invalid")) {
        setError("Невірний email або пароль.")
      } else {
        setError("Не вдалося увійти. Спробуйте ще раз.")
      }
      return
    }

    router.push("/admin")
    router.refresh()
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          На головну
        </Link>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="text-center">
            <span className="mx-auto mb-2 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="size-6" />
            </span>
            <CardTitle className="font-heading text-xl">Вхід для адміністратора</CardTitle>
            <CardDescription>Увійдіть, щоб керувати заявками на бронювання.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" size="lg" className="mt-1 w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Вхід...
                  </>
                ) : (
                  "Увійти"
                )}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-muted-foreground text-pretty">
              Немає облікового запису?{" "}
              <Link href="/admin/sign-up" className="font-medium text-primary hover:underline">
                Створити акаунт адміністратора
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
