"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/users`

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ firstName: "", lastName: "", username: "", email: "", mobile: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
    setError("")
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    setError("")

    const user = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      username: form.username.trim().toLowerCase(),
      email: form.email.trim().toLowerCase(),
      mobile: form.mobile.trim(),
      password: form.password,
      role: "Passenger",
    }

    if (!user.firstName || !user.lastName || !user.username) {
      setError("Please fill in your name and username.")
      return
    }

    try {
      setSaving(true)
      const response = await fetch(apiUrl)
      if (!response.ok) throw new Error("Could not check existing users.")
      const users = await response.json()
      if (users.some((item) => item.username.toLowerCase() === user.username)) {
        setError("This username is already taken.")
        return
      }
      if (users.some((item) => item.email.toLowerCase() === user.email)) {
        setError("This email is already registered.")
        return
      }

      const saved = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      })
      if (!saved.ok) throw new Error("Could not create your account.")
      router.push("/")
    } catch (error) {
      setError(`${error.message} Please check that the API is running and try again.`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 px-5 py-12">
      <section aria-labelledby="signup-heading" className="w-full max-w-2xl rounded-xl border bg-card p-6 sm:p-9">
        <div className="mb-8 text-xl font-semibold">IRCTC</div>
        <h1 id="signup-heading" className="text-3xl font-semibold tracking-tight">Sign up</h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <fieldset disabled={saving} className="grid grid-cols-2 gap-5">
            <legend className="sr-only">Your details</legend>
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" name="firstName" className="h-11" autoComplete="given-name" value={form.firstName} onChange={handleChange} required maxLength={80} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" name="lastName" className="h-11" autoComplete="family-name" value={form.lastName} onChange={handleChange} required maxLength={80} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" className="h-11" autoComplete="username" value={form.username} onChange={handleChange} required minLength={3} maxLength={30} pattern="[a-zA-Z0-9_]+" title="Use letters, numbers, or underscores" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" className="h-11" type="email" autoComplete="email" value={form.email} onChange={handleChange} required maxLength={254} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile number</Label>
              <Input id="mobile" name="mobile" className="h-11" type="tel" autoComplete="tel-national" inputMode="numeric" value={form.mobile} onChange={handleChange} required pattern="[0-9]{10}" maxLength={10} title="Enter a 10-digit mobile number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" className="h-11" type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.password} onChange={handleChange} required minLength={6} maxLength={128} aria-describedby="password-help" />
              <p id="password-help" className="text-xs text-muted-foreground">Use at least 6 characters.</p>
              <label className="flex w-fit cursor-pointer items-center gap-2 py-1 text-sm text-muted-foreground">
                <input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} className="size-4 accent-primary" />
                Show password
              </label>
            </div>
          </fieldset>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="h-11 w-full" disabled={saving}>{saving ? "Creating account…" : "Sign up"}</Button>
        </form>
        <div className="mt-4 flex items-center justify-center gap-1 text-sm">
          <span>Already have an account?</span>
          <Button type="button" variant="link" onClick={() => router.push("/")}>Sign in</Button>
        </div>
      </section>
    </main>
  )
}
