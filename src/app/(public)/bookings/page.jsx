"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useUser } from '@/components/account-layout'
import { api, money } from '@/lib/api'
import { Button } from '@/components/ui/button'

export default function BookingsPage() {
  const { user } = useUser()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelId, setCancelId] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    api(`bookings?userId=${encodeURIComponent(user.id)}`)
    .then(data => { if (active) setBookings(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt))) })
    .catch(error => { if (active) setError(error.message) })
    .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user.id, retry])

  const cancelBooking = async () => {
    if (saving) return
    setError('')
    setMessage('')
    try {
      setSaving(true)
      const response = await fetch('/api/bookings', { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ id: cancelId, userId: user.id }) 
      })
      const booking = await response.json()
      if (!response.ok) throw new Error(booking.error || 'Could not cancel the booking.')
      setBookings(bookings.map(item => item.id === booking.id ? booking : item))
      setCancelId('')
      setMessage(`Booking ${booking.pnr} cancelled. The mock refund is complete and seats are available again.`)
    } catch (error) { setError(error.message) }
    finally { setSaving(false) }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-semibold">My bookings</h1></div>
      <p className="mt-2 text-muted-foreground">Your confirmations and cancellations. Payments and refunds are simulated.</p>
      {message && <p role="status" className="mt-5">{message}</p>}
      {error && 
      <div role="alert" className="mt-5 space-y-3">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={() => { setLoading(true); setError(''); setRetry(value => value + 1) }}>Reload bookings</Button>
        </div>
      }
      {loading ? 
      <p role="status" className="mt-8">Loading bookings…</p> : bookings.length === 0 ? <p className="mt-8">No bookings yet. Search for a train to get started.</p> : <div className="mt-8 space-y-6">
        {bookings.map(booking => <article key={booking.id} className="space-y-5 rounded-xl border p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{booking.trainName} ({booking.trainNumber})</h2>
              <p className="mt-1 text-sm">PNR: <strong>{booking.pnr}</strong></p>
            </div>
            <span className={`rounded-md px-3 py-1 text-sm font-medium ${booking.status === 'Confirmed' ? 'bg-green-100 text-green-900' : 'bg-slate-100 text-slate-700'}`}>{booking.status}</span>
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <p>{booking.origin} → {booking.destination}</p>
            <p>Journey date: {booking.date}</p>
            <p>Departure: {booking.departure} · Arrival: {booking.arrival} (IST)</p>
            <p>{booking.travelClass} · {booking.quota} quota</p>
          </div>
          <div>
            <h3 className="font-medium">Passengers</h3>
            <ul className="mt-2 space-y-1 text-sm">{booking.passengers.map((passenger, index) => 
              <li key={index}>{passenger.name} · Age {passenger.age} · {passenger.gender} · Berth preference: {passenger.berth}</li>
              )}
              </ul>
              </div>
          <div className="border-t pt-4 text-sm">
            <p>Total: <strong>{money(booking.amount)}</strong> · {booking.paymentStatus}</p>
            <p className="mt-1 text-muted-foreground">{booking.paymentMethod} · Transaction {booking.transactionId}</p>
            </div>
          {booking.status === 'Confirmed' && (cancelId === booking.id ? 
          <div className="space-y-3">
            <p>Cancel this ticket for all passengers? The full amount will be refunded in the simulation.</p>
            <div className="flex gap-3">
            <Button variant="destructive" disabled={saving} onClick={cancelBooking}>{saving ? 'Cancelling…' : 'Confirm cancellation'}</Button>
            <Button variant="outline" disabled={saving} onClick={() => setCancelId('')}>Keep booking</Button>
            </div>
            </div> 
            : <Button variant="outline" disabled={saving} onClick={() => setCancelId(booking.id)}>Cancel booking</Button>
            )}
        </article>)}
      </div>}
    </main>
  )
}

