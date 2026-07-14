import { db } from './db'

export async function getValidGoogleToken(userId: string): Promise<string | null> {
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

export type GoogleCalendarEvent = {
  id: string
  title: string
  start: string
  end?: string
  allDay: boolean
  location: string | null
  description: string | null
}

export async function fetchGoogleEvents(token: string, timeMin: string, timeMax: string): Promise<GoogleCalendarEvent[]> {
  const headers = { Authorization: `Bearer ${token}` }

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

  const seen = new Set<string>()
  const allItems: Record<string, unknown>[] = []
  for (const batch of results) {
    for (const e of batch) {
      if (!seen.has(e.id as string)) {
        seen.add(e.id as string)
        allItems.push(e)
      }
    }
  }

  return allItems.map((e) => ({
    id: e.id as string,
    title: (e.summary as string) ?? '(sem título)',
    start: ((e.start as Record<string, string>)?.dateTime ?? (e.start as Record<string, string>)?.date) as string,
    end: ((e.end as Record<string, string>)?.dateTime ?? (e.end as Record<string, string>)?.date) as string | undefined,
    allDay: !(e.start as Record<string, string>)?.dateTime,
    location: (e.location as string) ?? null,
    description: (e.description as string) ?? null,
  }))
}
