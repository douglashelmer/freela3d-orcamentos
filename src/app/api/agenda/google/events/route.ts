import { auth } from '@/auth'
import { getValidGoogleToken, fetchGoogleEvents } from '@/lib/google-calendar'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getValidGoogleToken(session.user.id)
  if (!token) return NextResponse.json({ events: [], connected: false })

  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))

  // Use UTC boundaries covering the full local month with ±1 day buffer
  const timeMin = new Date(Date.UTC(year, month - 1, 1)).toISOString()
  const timeMax = new Date(Date.UTC(year, month, 1)).toISOString()

  const items = await fetchGoogleEvents(token, timeMin, timeMax)
  const events = items.map(e => ({ ...e, color: '#34d399', source: 'google' }))

  return NextResponse.json({ events, connected: true })
}
