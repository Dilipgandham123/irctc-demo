"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

const UserContext = createContext(null)
export const useUser = () => useContext(UserContext)

export default function AccountLayout({ children, admin = false }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
     const loadUser = async () => {
      const id = localStorage.getItem('irctcUserId')
      if (!id) { router.replace('/'); return }
      try {
        const account = await api(`users/${encodeURIComponent(id)}`)
        if (!active) return
        if (admin !== (account.role === 'Administrator')) {
          router.replace(account.role === 'Administrator' ? '/train' : '/user')
          return
        }
        setUser(account)
      } catch {
        if (active) setError('Could not load your account. Start the API and reload this page, or sign in again.')
      }
    }
    loadUser()
    return () => { active = false }
  }, [admin, router])

  function signOut() {
    localStorage.removeItem('irctcUserId')
    setUser(null)
    router.replace('/')
  }

  const links = admin ? [['/train', 'Train routes']] : [['/user', 'Search trains'], ['/bookings', 'My bookings'], ['/passengers', 'Passengers'], ['/payments', 'Payment methods'], ['/profile', 'Profile']]

  if (!user) return 
  <main className="mx-auto max-w-xl space-y-4 p-8">
    <p role={error ? 'alert' : 'status'}>{error || 'Loading your account…'}</p>
    {error && 
    <Button onClick={signOut}>
      Sign in again
    </Button>
    }
    </main>

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href={admin ? '/train' : '/user'} className="text-xl font-semibold">IRCTC</Link>
          <Button variant="outline" onClick={signOut}>Sign out</Button>
          <nav aria-label="Account navigation" className="flex w-full flex-wrap gap-x-6 gap-y-3 text-sm">
            {links.map(([href, label]) => 
            <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined} className={pathname === href ? 'font-semibold underline underline-offset-8' : 'text-slate-600 hover:underline'}>
              {label}
            </Link>
          )}
          </nav>
        </div>
      </header>
      {children}
    </UserContext.Provider>
  )
}
