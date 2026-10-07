"use client"

import { useEffect, useState } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import BookingDialog from '@/components/booking-dialog'
import { today, validDate } from '@/lib/booking.mjs'
import { money } from '@/lib/api'

export default function UserHomePage() {
  const [form, setForm] = useState({ from: '', to: '', date: today(), travelClass: 'Sleeper', quota: 'General' })
  const [search, setSearch] = useState({ from: '', to: '', date: today(), travelClass: 'Sleeper', quota: 'General' })
  const [trains, setTrains] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [retry, setRetry] = useState(0)
  const [selectedTrain, setSelectedTrain] = useState(null)
  const [availabilityId, setAvailabilityId] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    async function loadTrains() {
      setLoading(true)
      setError('')
      try {
        const params = new URLSearchParams({ date: search.date, travelClass: search.travelClass, quota: search.quota })
        const response = await fetch(`/api/availability?${params}`, { signal: controller.signal })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Could not load trains.')
        setTrains(data)
      } catch (error) {
        if (!controller.signal.aborted) setError(error.message)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    loadTrains()
    return () => controller.abort()
  }, [search.date, search.travelClass, search.quota, retry])

  const change = (event) => { setForm({ ...form, [event.target.name]: event.target.value }); setFormError('') }

  const handleSearch = (event) => {
    event.preventDefault()
    if (!validDate(form.date)) { setFormError('Choose today or a future date.'); return }
    if (!form.from.trim() || !form.to.trim()) { setFormError('Enter both stations.'); return }
    if (form.from.trim().toLowerCase() === form.to.trim().toLowerCase()) { setFormError('Source and destination must be different.'); return }
    setSearch({ ...form, from: form.from.trim(), to: form.to.trim() })
    setRetry(value => value + 1)
  }

  const showAll = () => {
    setForm({ ...form, from: '', to: '' })
    setSearch({ ...search, from: '', to: '' })
  }

  const stations = [...new Set(trains.flatMap(train => [train.origin, train.destination]))].sort()
  const results = trains.filter(train => (!search.from || train.origin.toLowerCase().includes(search.from.toLowerCase())) && (!search.to || train.destination.toLowerCase().includes(search.to.toLowerCase())))

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
      <h1 className="text-3xl font-semibold">Find your next train</h1>
      <p className="mt-2 text-muted-foreground">Choose a route and journey date to check availability.</p>
      <form onSubmit={handleSearch} className="mt-8 space-y-5 rounded-xl border p-6">
        <div className="grid items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
          <div className="space-y-2">
            <Label htmlFor="from">Source</Label>
            <Input id="from" name="from" list="stations" placeholder="e.g. Hyderabad" value={form.from} onChange={change} required maxLength={100} /></div>
          <Button type="button" variant="outline" className="justify-self-center" aria-label="Swap source and destination" onClick={() => setForm({ ...form, from: form.to, to: form.from })}>
            <ArrowRightLeft />
            </Button>
          <div className="space-y-2">
            <Label htmlFor="to">Destination</Label>
            <Input id="to" name="to" list="stations" placeholder="e.g. Vizag" value={form.to} onChange={change} required maxLength={100} /></div>
        </div>
        <datalist id="stations">{stations.map(station => <option key={station} value={station} />)}</datalist>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="date">Journey date</Label>
            <Input id="date" name="date" type="date" min={today()} value={form.date} onChange={change} required />
            </div>
          <div className="space-y-2">
            <Label htmlFor="travelClass">Class</Label>
            <select id="travelClass" name="travelClass" className="h-10 w-full rounded-lg border bg-background px-3 text-sm" value={form.travelClass} onChange={change}>
              <option>Sleeper</option>
              <option>AC 3 Tier</option>
              <option>AC 2 Tier</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quota">Quota</Label>
            <select id="quota" name="quota" className="h-10 w-full rounded-lg border bg-background px-3 text-sm" value={form.quota} onChange={change}>
              <option>General</option>
              <option>Tatkal</option>
            </select>
          </div>
        </div>
        {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
        <Button type="submit" disabled={loading}>{loading ? 'Checking…' : 'Search trains / Check availability'}</Button>
      </form>

      <section className="mt-10" aria-labelledby="results-heading">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="results-heading" className="text-xl font-semibold">
              {search.from ? `${search.from} to ${search.to}` : 'Available train routes'}
              </h2>
            <p className="mt-1 text-sm text-muted-foreground">{search.date} · {search.travelClass} · {search.quota} · Times in IST</p>
            </div>
          {search.from && 
          <Button variant="outline" onClick={showAll}>
            Show all routes
            </Button>
          }
        </div>
        {loading ? 
        <p role="status">Checking availability…</p> : error ? 
        <div role="alert" className="space-y-4">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" onClick={() => setRetry(value => value + 1)}>Try again</Button>
          </div> : <>
          <p role="status" className="mb-4 text-sm text-muted-foreground">{results.length} train{results.length === 1 ? '' : 's'} found</p>
          {results.length === 0 ? 
          <p className="rounded-xl border p-8 text-center">No trains found. Try another route.</p> : 
          <div className="space-y-4">
            {results.map(train => 
            <article key={train.id} className="grid items-center gap-6 rounded-xl border p-6 lg:grid-cols-[1fr_1.3fr_auto]">
            <div>
              <h3 className="text-lg font-semibold">{train.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">Train #{train.number}</p>
              </div>
            <div className="flex justify-between gap-5">
              <div>
                <p className="text-xl font-semibold">{train.departure}</p>
                <p className="mt-1 text-sm">{train.origin}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold">{train.arrival}</p>
                  <p className="mt-1 text-sm">{train.destination}</p>
                  </div>
                  </div>
            <div className="space-y-2 lg:text-right">
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Button variant="outline" onClick={() => setAvailabilityId(train.id)}>Check availability</Button>
                <Button disabled={train.available === 0} onClick={() => setSelectedTrain(train)}>Book now</Button>
                </div>
              {availabilityId === train.id && 
              <p role="status" className="text-sm">{train.available} seats available · {money(train.price)} per passenger</p>
              }
            </div>
          </article>
        )}
        </div>
        }
        </>
        }
      </section>
      <p className="mt-8 text-sm text-muted-foreground">Simulation: trains run daily. Seat counts are separate for each date, class, and quota. Arrival may be on a later day.</p>
      {selectedTrain && <BookingDialog train={selectedTrain} journey={{ date: search.date, travelClass: search.travelClass, quota: search.quota }} onClose={() => { setSelectedTrain(null); setRetry(value => value + 1) }} />}
    </main>
  )
}

