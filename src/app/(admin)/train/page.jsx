"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/trains`

const fareFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })

export default function TrainRoutesPage() {
  const [form, setForm] = useState({ number: '', name: '', origin: '', destination: '', departure: '', arrival: '', fare: '', capacity: 40, tatkalCapacity: 10, runes: '' })
  const [trains, setTrains] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [retry, setRetry] = useState(0)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")
  const [notice, setNotice] = useState("")

  const loadTrains= async() => {
      setLoading(true)
      setLoadError("")
      try {
        const response = await fetch(apiUrl)
        if (!response.ok) throw new Error("Could not load train routes.")
        const data = await response.json()
        if (!Array.isArray(data)) throw new Error("The API returned an invalid route list.")
        setTrains(data)
      } catch (error) {
         setLoadError(`${error.message} Check that the API is running with npm run dev.`)
      } finally {
         setLoading(false)
      }
    }

  useEffect(() => {
    loadTrains()
  }, [])

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
    setFormError('')
  }

   const handleSubmit = async(event) => {
    event.preventDefault()
    if (saving) return
    const route = {
      number: form.number.trim(),
      name: form.name.trim(),
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      departure: form.departure,
      arrival: form.arrival,
      fare: Number(form.fare),
      capacity: Number(form.capacity),
      tatkalCapacity: Number(form.tatkalCapacity),
      runes: form.runes.trim(),
    }
    setFormError('')
    if (!route.number || !route.name || !route.origin || !route.destination || !route.departure || !route.arrival || !route.runes || form.fare === '') {
      setFormError('Complete every field before adding the route.')
      return
    }
    if (route.origin.toLowerCase() === route.destination.toLowerCase()) {
      setFormError("Origin and destination must be different stations.")
      return
    }
    if (!/^[0-9]{5}$/.test(route.number) || !Number.isFinite(Number(route.fare)) || Number(route.fare) < 0) {
      setFormError("Enter a five-digit train number and a valid non-negative fare.")
      return
    }
    if (trains.some((train) => String(train.number) === route.number)) {
      setFormError("A route with this train number already exists.")
      return
    }
    if (!Number.isInteger(route.capacity) || route.capacity < 1 || !Number.isInteger(route.tatkalCapacity) || route.tatkalCapacity < 0) {
      setFormError("Enter valid seat capacities.")
      return
    }
    try {
      setSaving(true)
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(route),
      })
      if (!response.ok) throw new Error("The route could not be saved. Please try again.")
      const savedRoute = await response.json()
      setTrains((current) => [...current, savedRoute])
      setNotice(`${savedRoute.name} was added successfully.`)
      setOpen(false)
      setForm({ number: '', name: '', origin: '', destination: '', departure: '', arrival: '', fare: '', capacity: 40, tatkalCapacity: 10, runes: '' })
    } catch (error) {
      setFormError(`${error.message} Check that the API is running.`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Train routes</h1>
          <p className="mt-2 text-muted-foreground">Add train services and manage their route details.</p>
        </div>
        <Dialog open={open} onOpenChange={(nextOpen) => { if (!saving) { setOpen(nextOpen); setFormError("") } }}>
          <DialogTrigger render={<Button className="h-10" disabled={loading || Boolean(loadError)}>Add train route</Button>} />
          <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg" showCloseButton={!saving}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <DialogHeader>
                <DialogTitle>Add train route</DialogTitle>
                <DialogDescription>All routes run daily with Sleeper, AC 3 Tier, and AC 2 Tier classes. Enter the Sleeper fare and seat capacity per class. Times are in IST.</DialogDescription>
              </DialogHeader>
              <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
                <legend className="sr-only">Train route details</legend>
                <div className="space-y-2">
                  <Label htmlFor="train-number">Train number</Label>
                  <Input id="train-number" name="number" className="h-10" value={form.number} onChange={handleChange} placeholder="e.g. 12627" pattern="[0-9]{5}" maxLength={5} inputMode="numeric" title="Enter a five-digit train number" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="train-name">Train name</Label>
                  <Input id="train-name" name="name" className="h-10" value={form.name} onChange={handleChange} placeholder="e.g. Karnataka Express" maxLength={100} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="train-origin">Origin</Label>
                  <Input id="train-origin" name="origin" className="h-10" value={form.origin} onChange={handleChange} placeholder="e.g. Bengaluru" maxLength={100} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="train-destination">Destination</Label>
                  <Input id="train-destination" name="destination" className="h-10" value={form.destination} onChange={handleChange} placeholder="e.g. New Delhi" maxLength={100} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="train-departure">Departure time</Label>
                  <Input id="train-departure" name="departure" type="time" className="h-10" value={form.departure} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="train-arrival">Arrival time</Label>
                  <Input id="train-arrival" name="arrival" type="time" className="h-10" value={form.arrival} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="train-fare">Fare (INR)</Label>
                  <Input id="train-fare" name="fare" type="number" className="h-10" value={form.fare} onChange={handleChange} min={0} max={1000000} step="0.01" placeholder="e.g. 850" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="train-capacity">General seats per class</Label>
                  <Input id="train-capacity" name="capacity" type="number" className="h-10" value={form.capacity} onChange={handleChange} min={1} max={1000} step={1} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="train-tatkalCapacity">Tatkal seats per class</Label>
                  <Input id="train-tatkalCapacity" name="tatkalCapacity" type="number" className="h-10" value={form.tatkalCapacity} onChange={handleChange} min={0} max={1000} step={1} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="train-runes">Running In</Label>
                  <Input id="train-runes" name="runes" className="h-10" value={form.runes} onChange={handleChange} placeholder="e.g. Daily" maxLength={100} required />
                </div>
              </fieldset>
              {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
              <DialogFooter>
                <Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Add route"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>
      {notice && <p role="status" className="mb-4 text-sm">{notice}</p>}
      {loadError ? (
        <div role="alert" className="space-y-3 rounded-lg border p-5">
          <p className="text-sm text-destructive">{loadError}</p>
          <Button variant="outline" onClick={() => setRetry((current) => current + 1)}>Retry</Button>
        </div>
      ) : (
        <div className="rounded-lg border" aria-busy={loading}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Train number</TableHead><TableHead>Train name</TableHead>
                <TableHead>Origin</TableHead><TableHead>Destination</TableHead>
                <TableHead>Departure</TableHead><TableHead>Arrival</TableHead>
                <TableHead className="text-right">Fare</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trains.map((train) => (
                <TableRow key={train.id}>
                  <TableCell className="font-medium">{train.number}</TableCell><TableCell>{train.name}</TableCell>
                  <TableCell>{train.origin}</TableCell><TableCell>{train.destination}</TableCell>
                  <TableCell>{train.departure}</TableCell><TableCell>{train.arrival}</TableCell>
                  <TableCell className="text-right">{fareFormatter.format(train.fare)}</TableCell>
                </TableRow>
              ))}
              {(loading || trains.length === 0) && <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">{loading ? "Loading train routes…" : "No routes yet. Add your first train route to get started."}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      )}
    </main>
  )
}
