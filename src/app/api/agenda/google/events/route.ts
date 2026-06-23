import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

async function getValidToken(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { googleAccessToken: true, googleRefreshToken: true, googleTokenExpiry: true },
  })
  if (!user?.googleAccessToken) return null

  // Refresh if expired (with 5-minute buffer)
  if (user.googleTokenExpiry && user.googleTokenExpiry < new Date(Date.now() + 5 * 60 * 1000)) {
    if (!user.googleRefreshToken) return null
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: user.googleRefreshToken,
        grant_type: 'refresh_token',
      }),
    })
    if (!res.ok) return null
    const tokens = await res.json()
    const expiry = new Date(Date.now() + tokens.expires_in * 1000)
    await db.user.update({
      where: { id: userId },
      data: { googleAccessToken: tokens.access_token, googleTokenExpiry: expiry },
    })
    return tokens.access_token as string
  }

  return user.googleAccessToken
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getValidToken(session.user.id)
  if (!token) return NextResponse.json({ events: [], connected: false })

  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))
  const timeMin = new Date(year, month - 1, 1).toISOString()
  const timeMax = new Date(year, month, 1).toISOString()

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  })

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!res.ok) {
    let errDetail = `http_${res.status}`
    try { const b = await res.json(); errDetail = b.error?.message ?? b.error ?? errDetail } catch {}
    return NextResponse.json({ events: [], connected: true, error: errDetail })
  }

  const data = await res.json()
  const events = (data.items ?? []).map((e: Record<string, unknown>) => ({
    id: e.id,
    title: e.summary ?? '(sem título)',
    start: (e.start as Record<string, string>)?.dateTime ?? (e.start as Record<string, string>)?.date,
    end: (e.end as Record<string, string>)?.dateTime ?? (e.end as Record<string, string>)?.date,
    allDay: !(e.start as Record<string, string>)?.dateTime,
    color: (e.colorId ? null : '#34d399'),
    location: e.location ?? null,
    description: e.description ?? null,
    source: 'google',
  }))

  return NextResponse.json({ events, connected: true })
}
