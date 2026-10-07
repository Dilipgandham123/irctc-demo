export const classes = ['Sleeper', 'AC 3 Tier', 'AC 2 Tier']
export const quotas = ['General', 'Tatkal']
export const genders = ['Male', 'Female', 'Other']
export const berths = ['No preference', 'Lower', 'Middle', 'Upper', 'Side lower', 'Side upper']

export function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

export function validDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date && date >= today()
}

export function passengerError(passenger) {
  if (!passenger.name?.trim() || passenger.name.trim().length > 80) return 'Enter a passenger name (up to 80 characters).'
  if (!String(passenger.age).trim() || !Number.isInteger(Number(passenger.age)) || Number(passenger.age) < 1 || Number(passenger.age) > 120) return 'Passenger age must be between 1 and 120.'
  if (!genders.includes(passenger.gender)) return 'Select a gender.'
  if (!berths.includes(passenger.berth)) return 'Select a berth preference.'
  return ''
}

export function availability(train, bookings, date, travelClass, quota) {
  const capacity = Number(quota === 'Tatkal' ? train.tatkalCapacity ?? 10 : train.capacity ?? 40)
  const used = bookings.filter(booking => booking.status === 'Confirmed' && String(booking.trainId) === String(train.id) && booking.date === date && booking.travelClass === travelClass && booking.quota === quota).reduce((total, booking) => total + booking.passengers.length, 0)
  return Math.max(0, capacity - used)
}

export function ticketFare(train, travelClass, quota, count = 1) {
  const multiplier = { Sleeper: 1, 'AC 3 Tier': 2, 'AC 2 Tier': 3 }[travelClass]
  return Math.round((Number(train.fare) * multiplier + (quota === 'Tatkal' ? 100 : 0)) * count * 100) / 100
}
