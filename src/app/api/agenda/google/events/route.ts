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
      cache: 'no-store',
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

  // Use UTC boundaries covering the full local month with ±1 day buffer
  const timeMin = new Date(Date.UTC(year, month - 1, 1)).toISOString()
  const timeMax = new Date(Date.UTC(year, month, 1)).toISOString()

  const headers = { Authorization: `Bearer ${token}` }

  // Fetch list of all user calendars
  const calListRes = await fetch(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=50',
    { headers, cache: 'no-store' }
  )

  let calendarIds: string[] = ['primary']
  if (calListRes.ok) {
    const calList = await calListRes.json()
    calendarIds = (calList.items ?? [])
      .filter((c: { accessRole: string }) => ['owner', 'writer', 'reader'].includes(c.accessRole))
      .map((c: { id: string }) => c.id)
    if (calendarIds.length === 0) calendarIds = ['primary']
  }

  // Fetch events from all calendars in parallel
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  })

  const results = await Promise.all(
    calendarIds.map(async (calId) => {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?${params}`,
        { headers, cache: 'no-store' }
      )
      if (!res.ok) return []
      const data = await res.json()
      return data.items ?? []
    })
  )

  // Merge + deduplicate by event id
  const seen = new Set<string>()
  const allItems: Record<string, unknown>[] = []
  for (const batch of results) {
    for (const e of batch) {
      if (!seen.has(e.id)) {
        seen.add(e.id)
        allItems.push(e)
      }
    }
  }

  const events = allItems.map((e) => ({
    id: e.id,
    title: (e.summary as string) ?? '(sem título)',
    start: ((e.start as Record<string, string>)?.dateTime ?? (e.start as Record<string, string>)?.date) as string,
    end: ((e.end as Record<string, string>)?.dateTime ?? (e.end as Record<string, string>)?.date) as string | undefined,
    allDay: !(e.start as Record<string, string>)?.dateTime,
    color: '#34d399',
    location: (e.location as string) ?? null,
    description: (e.description as string) ?? null,
    source: 'google',
  }))

  return NextResponse.json({ events, connected: true })
}
