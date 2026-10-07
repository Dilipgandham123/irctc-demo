"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@/components/account-layout'
import { Input } from '@/components/ui/input'
import { api, money } from '@/lib/api'
import { passengerError, ticketFare } from '@/lib/booking.mjs'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const newPassenger = () => ({ name: '', age: '', gender: 'Male', berth: 'No preference' })

export default function BookingDialog({ train, journey, onClose }) {
  const { user } = useUser()
  const router = useRouter()
  const [passengers, setPassengers] = useState([newPassenger()])
  const [master, setMaster] = useState([])
  const [methods, setMethods] = useState([])
  const [methodId, setMethodId] = useState('')
  const [step, setStep] = useState('passengers')
  const [paymentResult, setPaymentResult] = useState('Success')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([
      api(`passengers?userId=${encodeURIComponent(user.id)}`), 
      api(`paymentMethods?userId=${encodeURIComponent(user.id)}`)])
      .then(([savedPassengers, paymentMethods]) => {
      if (!active) return
      setMaster(savedPassengers)
      setMethods(paymentMethods)
      setMethodId(paymentMethods[0]?.id || '')
    }).catch(error => { if (active) setError(error.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user.id])

  const updatePassenger = (index, passenger) => {
    setPassengers(passengers.map((item, position) => position === index ? passenger : item))
    setError('')
  }

  const handleSubmit = async(event) => {
    event.preventDefault()
    if (saving) return
    setError('')
    const validation = passengers.map(passengerError).find(Boolean)
    if (validation) { setError(validation); return }
    if (step === 'passengers') { setStep('payment'); return }
    if (!methodId) { setError('Save and select a payment method first.'); return }
    try {
      setSaving(true)
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, trainId: train.id, ...journey, passengers, paymentMethodId: methodId, paymentResult }),
      })
      const booking = await response.json()
      if (!response.ok) throw new Error(booking.error || 'Could not complete the booking.')
      router.push('/bookings')
      onClose()
    } catch (error) { setError(error.message) }
    finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={open => { if (!open && !saving) onClose() }}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl" showCloseButton={!saving}>
        <DialogHeader>
          <DialogTitle>{step === 'passengers' ? 'Passenger details' : 'Mock payment gateway'}</DialogTitle>
          <DialogDescription>{train.name} · {journey.date} · {journey.travelClass} · {journey.quota}</DialogDescription>
        </DialogHeader>
        {loading ? <p role="status">Loading saved details…</p> : <form onSubmit={handleSubmit} className="space-y-5">
          <fieldset disabled={saving} className="space-y-5">
            <legend className="sr-only">Booking details</legend>
            {step === 'passengers' ? <>
              {passengers.map((passenger, index) => 
              <div key={index} className="space-y-4 border-b pb-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Passenger {index + 1}</h3>
                  {passengers.length > 1 && 
                  <Button type="button" variant="ghost" onClick={() => setPassengers(passengers.filter((_, position) => position !== index))}>Remove</Button>
                  }
                  </div>
                {master.length > 0 && 
                <div className="space-y-2">
                  <Label htmlFor={`saved-${index}`}>Use a saved passenger</Label>
                  <select id={`saved-${index}`} className="h-10 w-full rounded-lg border bg-background px-3 text-sm" value="" onChange={event => { const selected = master.find(item => item.id === event.target.value); if (selected) updatePassenger(index, { name: selected.name, age: selected.age, gender: selected.gender, berth: selected.berth }) }}>
                    <option value="">Choose a passenger</option>
                    {master.map(item => <option key={item.id} value={item.id}>{item.name} · Age {item.age}
                    </option>)}
                    </select>
                    </div>
                    }
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`booking-${index}-name`}>Name</Label>
                    <Input id={`booking-${index}-name`} name="name" value={passenger.name} onChange={event => updatePassenger(index, { ...passenger, name: event.target.value })} required maxLength={80} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`booking-${index}-age`}>Age</Label>
                    <Input id={`booking-${index}-age`} name="age" type="number" value={passenger.age} onChange={event => updatePassenger(index, { ...passenger, age: event.target.value })} min={1} max={120} step={1} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`booking-${index}-gender`}>Gender</Label>
                    <select id={`booking-${index}-gender`} name="gender" className="h-10 w-full rounded-lg border bg-background px-3 text-sm" value={passenger.gender} onChange={event => updatePassenger(index, { ...passenger, gender: event.target.value })}>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`booking-${index}-berth`}>Berth preference</Label>
                    <select id={`booking-${index}-berth`} name="berth" className="h-10 w-full rounded-lg border bg-background px-3 text-sm" value={passenger.berth} onChange={event => updatePassenger(index, { ...passenger, berth: event.target.value })}>
                      <option>No preference</option>
                      <option>Lower</option>
                      <option>Middle</option>
                      <option>Upper</option>
                      <option>Side lower</option>
                      <option>Side upper</option>
                    </select>
                  </div>
                </div>
              </div>)}
              <Button type="button" variant="outline" disabled={passengers.length >= 6} onClick={() => setPassengers([...passengers, newPassenger()])}>Add another passenger</Button>
              <p className="text-xs text-muted-foreground">Up to 6 passengers. Berth preferences are requests, not guaranteed assignments.</p>
            </> : <>
              <ul className="divide-y">{passengers.map((passenger, index) => <li key={index} className="py-2">{passenger.name} · {passenger.age} · {passenger.gender} · {passenger.berth}</li>)}</ul>
              {methods.length === 0 ? 
              <p>No saved payment methods. 
                <Link className="underline" href="/payments">Add test payment details</Link> and then start the booking again.</p> : 
                <div className="space-y-2">
                  <Label htmlFor="booking-method">Payment method</Label>
                  <select id="booking-method" value={methodId} onChange={event => setMethodId(event.target.value)} className="h-10 w-full rounded-lg border bg-background px-3 text-sm" required>
                    {methods.map(method => <option key={method.id} value={method.id}>{method.label}
                    </option>
                    )}
                    </select>
                    </div>
                    }
              {/* <div className="space-y-2">
                <Label htmlFor="payment-result">Simulated gateway result</Label>
                <select id="payment-result" value={paymentResult} onChange={event => setPaymentResult(event.target.value)} className="h-10 w-full rounded-lg border bg-background px-3 text-sm">
                  <option value="Success">Payment successful</option>
                  <option value="Declined">Payment declined (test failure)</option>
                  </select>
                  </div> */}
            </>}
          </fieldset>
          <p className="text-lg font-semibold">Total: {money(ticketFare(train, journey.travelClass, journey.quota, passengers.length))}</p>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="outline" disabled={saving} onClick={() => step === 'payment' ? setStep('passengers') : onClose()}>{step === 'payment' ? 'Back' : 'Cancel'}</Button>
            <Button type="submit" disabled={saving || (step === 'payment' && methods.length === 0)}>{saving ? 'Processing…' : step === 'passengers' ? 'Continue to payment' : 'Pay and confirm'}</Button>
          </div>
        </form>}
      </DialogContent>
    </Dialog>
  )
}
