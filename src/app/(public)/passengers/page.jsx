"use client"

import { useEffect, useState } from 'react'
import { useUser } from '@/components/account-layout'
import { api } from '@/lib/api'
import { passengerError } from '@/lib/booking.mjs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function PassengersPage() {
  const { user } = useUser()
  const [passengers, setPassengers] = useState([])
  const [form, setForm] = useState({name: '', age: '', gender: 'Male', berth: 'No preference'})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    api(`passengers?userId=${encodeURIComponent(user.id)}`)
    .then(data => { if (active) setPassengers(data) })
    .catch(error => { if (active) setError(error.message) })
    .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user.id])

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    setError('')
    setMessage('')
    const validation = passengerError(form)
    if (validation) { setError(validation); return }
    try {
      setSaving(true)
      const passenger = await api('passengers', { 
        method: 'POST', 
        body: JSON.stringify({ ...form, name: form.name.trim(), age: Number(form.age), userId: user.id }) 
      })
      setPassengers([...passengers, passenger])
      setForm({name: '', age: '', gender: 'Male', berth: 'No preference'})
      setMessage('Passenger saved to your master list.')
    } catch (error) { setError(error.message) }
    finally { setSaving(false) }
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10">
      <h1 className="text-3xl font-semibold">Passenger master list</h1>
      <p className="mt-2 text-muted-foreground">Save passengers to reuse their details while booking.</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-xl border p-6">
        <fieldset disabled={saving} className="grid gap-5 sm:grid-cols-2">
          <legend className="sr-only">Passenger details</legend>
          <div className="space-y-2">
            <Label htmlFor="master-name">Name</Label>
            <Input id="master-name" name="name" value={form.name} onChange={handleChange} required maxLength={80} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="master-age">Age</Label>
            <Input id="master-age" name="age" type="number" value={form.age} onChange={handleChange} min={1} max={120} step={1} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="master-gender">Gender</Label>
            <select id="master-gender" name="gender" className="h-10 w-full rounded-lg border bg-background px-3 text-sm" value={form.gender} onChange={handleChange}>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="master-berth">Berth preference</Label>
            <select id="master-berth" name="berth" className="h-10 w-full rounded-lg border bg-background px-3 text-sm" value={form.berth} onChange={handleChange}>
              <option>No preference</option>
              <option>Lower</option>
              <option>Middle</option>
              <option>Upper</option>
              <option>Side lower</option>
              <option>Side upper</option>
            </select>
          </div>
        </fieldset>
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save passenger'}</Button>
      </form>
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      {message && <p role="status" className="mt-4 text-sm">{message}</p>}
      <h2 className="mt-8 text-xl font-semibold">Saved passengers</h2>
      {loading ? <p role="status" className="mt-4">Loading passengers…</p> : passengers.length === 0 ? <p className="mt-4 text-muted-foreground">No saved passengers yet.</p> : <ul className="mt-4 divide-y rounded-xl border px-5">{passengers.map(passenger => <li key={passenger.id} className="py-4"><p className="font-medium">{passenger.name}</p><p className="mt-1 text-sm text-muted-foreground">Age {passenger.age} · {passenger.gender} · {passenger.berth}</p></li>)}</ul>}
    </main>
  )
}

