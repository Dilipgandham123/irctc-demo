import { randomUUID } from 'node:crypto'
import { availability, classes, quotas, passengerError, ticketFare, validDate } from './booking.mjs'

const baseUrl = process.env.JSON_SERVER_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}/${path}`, { ...options, headers: { 'Content-Type': 'application/json' }, cache: 'no-store' })
  if (!response.ok) throw new Error('The mock API is unavailable. Please try again.')
  return response.json()
}

let pending = Promise.resolve()
export async function trainAvailability(date, travelClass, quota) {
  if (!validDate(date) || !classes.includes(travelClass) || !quotas.includes(quota)) throw new Error('Choose a valid future date, class, and quota.')
  const [trains, bookings] = await Promise.all([request('trains'), request('bookings')])
  return trains.map(train => ({ ...train, available: availability(train, bookings, date, travelClass, quota), price: ticketFare(train, travelClass, quota) }))
}

export function bookingWrite(action) {
  const result = pending.then(action)
  pending = result.catch(() => {})
  return result
}

export async function createBooking(data) {
  if (!data.userId || !data.trainId || !data.paymentMethodId) throw new Error('Choose a train and a saved payment method.')
  if (!validDate(data.date)) throw new Error('Choose today or a future journey date.')
  if (!classes.includes(data.travelClass) || !quotas.includes(data.quota)) throw new Error('Choose a valid class and quota.')
  if (!Array.isArray(data.passengers) || data.passengers.length < 1 || data.passengers.length > 6) throw new Error('Add between 1 and 6 passengers.')
  for (const passenger of data.passengers) {
    const error = passengerError(passenger)
    if (error) throw new Error(error)
  }
  const [user, train, method, bookings] = await Promise.all([
    request(`users/${encodeURIComponent(data.userId)}`),
    request(`trains/${encodeURIComponent(data.trainId)}`),
    request(`paymentMethods/${encodeURIComponent(data.paymentMethodId)}`),
    request('bookings'),
  ])
  if (user.role !== 'Passenger' || method.userId !== user.id) throw new Error('This payment method does not belong to your account.')
  if (availability(train, bookings, data.date, data.travelClass, data.quota) < data.passengers.length) throw new Error('Not enough seats are available. Search again or choose another class or quota.')
  if (data.paymentResult === 'Declined') throw new Error('Mock payment declined. No ticket was booked. Try again with a successful payment.')
  if (data.paymentResult !== 'Success') throw new Error('Select a mock payment result.')
  const amount = ticketFare(train, data.travelClass, data.quota, data.passengers.length)
  if (!Number.isFinite(amount) || amount < 0) throw new Error('The train fare is invalid.')
  const booking = {
    id: randomUUID(),
    pnr: randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase(),
    userId: user.id,
    trainId: train.id,
    trainName: train.name,
    trainNumber: train.number,
    origin: train.origin,
    destination: train.destination,
    departure: train.departure,
    arrival: train.arrival,
    date: data.date,
    travelClass: data.travelClass,
    quota: data.quota,
    passengers: data.passengers.map(passenger => ({ name: passenger.name.trim(), age: Number(passenger.age), gender: passenger.gender, berth: passenger.berth })),
    amount,
    paymentMethod: method.label,
    paymentStatus: 'Paid (simulated)',
    transactionId: `MOCK-${randomUUID().slice(0, 8).toUpperCase()}`,
    status: 'Confirmed',
    createdAt: new Date().toISOString(),
  }
  return request('bookings', { method: 'POST', body: JSON.stringify(booking) })
}

export async function cancelBooking(data) {
  if (!data.id || !data.userId) throw new Error('Choose a booking to cancel.')
  const booking = await request(`bookings/${encodeURIComponent(data.id)}`)
  if (booking.userId !== data.userId) throw new Error('This booking does not belong to your account.')
  if (booking.status === 'Cancelled') return booking
  return request(`bookings/${encodeURIComponent(data.id)}`, { method: 'PATCH', body: JSON.stringify({ status: 'Cancelled', paymentStatus: 'Refunded (simulated)', cancelledAt: new Date().toISOString() }) })
}
