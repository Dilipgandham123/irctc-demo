import { trainAvailability } from '@/lib/booking-server.mjs'

export async function GET(request) {
  try {
    const params = new URL(request.url).searchParams
    const result = await trainAvailability(params.get('date'), params.get('travelClass'), params.get('quota'))
    return Response.json(result)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }
}
