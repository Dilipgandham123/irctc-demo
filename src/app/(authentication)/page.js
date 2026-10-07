"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (loading) return
    setError("")
    try {
      setLoading(true)
      const loginUsername = username.trim().toLowerCase()
      let match = "";
      if (!match) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
        const response = await fetch(`${apiUrl}/users?username=${encodeURIComponent(loginUsername)}`)
        if (!response.ok) throw new Error("Could not sign in. Check that the API is running.")
        const users = await response.json()
        match = users.find((item) => item.password === password)
      }
      if (!match) {
        setError("Username or password is incorrect.")
        return
      }
      localStorage.setItem("irctcUserId", match.id)
      router.push(`/${match.role === "Administrator" ? "train" : "user"}`)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 px-5 py-12">
      <section aria-labelledby="login-heading" className="w-full max-w-md rounded-xl border bg-card p-6 sm:p-9">
        <div className="mb-8 flex items-center gap-3 text-primary">
          <span className="text-xl font-semibold">IRCTC</span>
        </div>
            <h1 id="login-heading" className="text-3xl font-semibold tracking-tight">Sign in</h1>
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" className="h-11" autoComplete="username" value={username} onChange={(event) => { setUsername(event.target.value); setError("") }} required maxLength={80} aria-invalid={Boolean(error)} aria-describedby={error ? "login-error" : undefined} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" className="h-11" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); setError("") }} required aria-invalid={Boolean(error)} aria-describedby={error ? "login-error" : undefined} />
                <label className="flex w-fit cursor-pointer items-center gap-2 py-1 text-sm text-muted-foreground">
                  <input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} className="size-4 accent-primary" />
                  Show password
                </label>
              </div>
              {error && <p id="login-error" role="alert" className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="h-11 w-full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</Button>
            </form>

            <div className="mt-4 flex items-center justify-center gap-2">
               <Button type="button" variant="link" onClick={() => router.push("/signup")}>Sign up</Button>
            </div>
      </section>
    </main>
  )
}

