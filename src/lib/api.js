const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function api(path, options = {}) {
  const response = await fetch(`${apiUrl}/${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    cache: 'no-store',
  })
  if (!response.ok) throw new Error('Could not save or load data. Check that the API is running.')
  return response.status === 204 ? null : response.json()
}

export const money = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)
