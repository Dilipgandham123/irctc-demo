import { bookingWrite, createBooking, cancelBooking } from '@/lib/booking-server.mjs'

export async function POST(request) {
  try {
    const data = await request.json()
    const booking = await bookingWrite(() => createBooking(data))
    return Response.json(booking, { status: 201 })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }
}

export async function PATCH(request) {
  try {
    const data = await request.json()
    const booking = await bookingWrite(() => cancelBooking(data))
    return Response.json(booking)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }
}
