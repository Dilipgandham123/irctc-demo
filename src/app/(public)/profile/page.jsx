"use client"

import { useState } from 'react'
import { useUser } from '@/components/account-layout'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ProfilePage() {
  const { user, setUser } = useUser()
  const [form, setForm] = useState({ firstName: user.firstName, lastName: user.lastName, email: user.email, mobile: user.mobile })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
    setMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    setError('')
    setMessage('')
    const details = { firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim().toLowerCase(), mobile: form.mobile.trim() }
    if (!details.firstName || !details.lastName) { setError('Enter your first and last name.'); return }
    try {
      setSaving(true)
      const accounts = await api('users')
      if (accounts.some(account => account.id !== user.id && account.email.toLowerCase() === details.email)) throw new Error('This email is already registered.')
      const updated = await api(`users/${user.id}`, { method: 'PATCH', body: JSON.stringify(details) })
      setUser(updated)
      setMessage('Profile saved.')
    } catch (error) { setError(error.message) }
    finally { setSaving(false) }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10">
      <h1 className="text-3xl font-semibold">My profile</h1>
      <p className="mt-2 text-muted-foreground">Username: {user.username}</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-xl border p-6">
        <fieldset disabled={saving} className="grid gap-5 sm:grid-cols-2">
          <legend className="sr-only">Profile details</legend>
          <div className="space-y-2"><Label htmlFor="firstName">First name</Label><Input id="firstName" name="firstName" value={form.firstName} onChange={handleChange} autoComplete="given-name" required maxLength={80} /></div>
          <div className="space-y-2"><Label htmlFor="lastName">Last name</Label><Input id="lastName" name="lastName" value={form.lastName} onChange={handleChange} autoComplete="family-name" required maxLength={80} /></div>
          <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" value={form.email} onChange={handleChange} autoComplete="email" required /></div>
          <div className="space-y-2"><Label htmlFor="mobile">Mobile number</Label><Input id="mobile" name="mobile" type="tel" value={form.mobile} onChange={handleChange} autoComplete="tel-national" pattern="[0-9]{10}" maxLength={10} title="Enter a 10-digit mobile number" required /></div>
        </fieldset>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {message && <p role="status" className="text-sm">{message}</p>}
        <Button disabled={saving} type="submit">{saving ? 'Saving…' : 'Save profile'}</Button>
      </form>
    </main>
  )
}

