"use client"

import { useEffect, useState } from 'react'
import { useUser } from '@/components/account-layout'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function PaymentsPage() {
  const { user } = useUser()
  const [methods, setMethods] = useState([])
  const [type, setType] = useState('UPI')
  const [form, setForm] = useState({ holder: '', number: '', expiry: '', upi: '' })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    api(`paymentMethods?userId=${encodeURIComponent(user.id)}`)
    .then(data => { if (active) setMethods(data) })
    .catch(error => { if (active) setError(error.message) })
    .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user.id])

  const change = (event) => { 
    setForm({ ...form, [event.target.name]: event.target.value }); 
    setMessage('') 
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    setError('')
    setMessage('')
    const method = { userId: user.id, type }
    if (type === 'UPI') {
      if (!/^[a-zA-Z0-9._-]+@[a-zA-Z]+$/.test(form.upi.trim())) { setError('Enter a valid mock UPI ID, such as demo@upi.'); return }
      method.upi = form.upi.trim().toLowerCase()
      method.label = `UPI · ${method.upi}`
    } else {
      if (!form.holder.trim() || !/^\d{16}$/.test(form.number)) { setError('Enter a cardholder name and a 16-digit test card number.'); return }
      const [year, month] = form.expiry.split('-').map(Number)
      if (!year || !month || new Date(year, month, 1) <= new Date()) { setError('Choose a current or future expiry month.'); return }
      method.holder = form.holder.trim()
      method.last4 = form.number.slice(-4)
      method.expiry = form.expiry
      method.label = `${type} · ending ${method.last4}`
    }
    try {
      setSaving(true)
      const saved = await api('paymentMethods', { method: 'POST', body: JSON.stringify(method) })
      setMethods([...methods, saved])
      setForm({ holder: '', number: '', expiry: '', upi: '' })
      setMessage('Payment method saved.')
    } catch (error) { 
      setError(error.message) 
    } finally { 
      setSaving(false) 
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10">
      <h1 className="text-3xl font-semibold">Payment methods</h1>
      <p className="mt-2 text-muted-foreground">Use test details only. No money is charged. Full card numbers and CVVs are never saved.</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-xl border p-6">
        <fieldset disabled={saving} className="space-y-5">
          <legend className="sr-only">Mock payment details</legend>
          <div className="space-y-2">
            <Label htmlFor="payment-type">Payment type</Label>
            <select id="payment-type" value={type} onChange={event => { setType(event.target.value); setError('') }} className="h-10 w-full rounded-lg border bg-background px-3 text-sm">
              <option>UPI</option>
              <option>Debit card</option>
              <option>Credit card</option>
            </select>
          </div>
          {type === 'UPI' ? 
          <div className="space-y-2">
            <Label htmlFor="upi">Mock UPI ID</Label>
            <Input id="upi" name="upi" placeholder="demo@upi" value={form.upi} onChange={change} required maxLength={80} />
            </div> : 
            <>
            <div className="space-y-2">
              <Label htmlFor="holder">Cardholder name</Label>
              <Input id="holder" name="holder" value={form.holder} onChange={change} required maxLength={80} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="number">Test card number</Label>
              <Input id="number" name="number" placeholder="4111111111111111" inputMode="numeric" pattern="[0-9]{16}" maxLength={16} value={form.number} onChange={change} required autoComplete="off" />
              <p className="text-xs text-muted-foreground">Example test number: 4111111111111111</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry month</Label>
              <Input id="expiry" name="expiry" type="month" value={form.expiry} onChange={change} required />
            </div>
          </>}
        </fieldset>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {message && <p role="status" className="text-sm">{message}</p>}
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save payment method'}</Button>
      </form>
      <h2 className="mt-8 text-xl font-semibold">Saved methods</h2>
      {loading ? 
      <p role="status" className="mt-4">Loading payment methods…</p> : methods.length === 0 ? <p className="mt-4 text-muted-foreground">No payment methods saved yet.</p> : 
      <ul className="mt-4 divide-y rounded-xl border px-5">
        {methods.map(method => 
        <li key={method.id} className="py-4">
          <p className="font-medium">{method.label}</p>
          {method.holder && 
          <p className="mt-1 text-sm text-muted-foreground">{method.holder} · Expires {method.expiry}
          </p>
          }
          </li>
        )}
        </ul>
        }
    </main>
  )
}

