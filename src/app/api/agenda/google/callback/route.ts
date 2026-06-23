import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const userId = searchParams.get('state')
  const error = searchParams.get('error')

  const appUrl = process.env.NEXTAUTH_URL ?? ''

  if (error || !code || !userId) {
    const msg = encodeURIComponent(error ?? (!code ? 'sem_codigo' : 'sem_state'))
    return NextResponse.redirect(`${appUrl}/admin/configuracoes?gcal=error&msg=${msg}`)
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
  const redirectUri = `${appUrl}/api/agenda/google/callback`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    let errMsg = `http_${tokenRes.status}`
    try { const b = await tokenRes.json(); errMsg = b.error_description ?? b.error ?? errMsg } catch {}
    return NextResponse.redirect(`${appUrl}/admin/configuracoes?gcal=error&msg=${encodeURIComponent(errMsg)}`)
  }

  const tokens = await tokenRes.json()

  if (!tokens.access_token) {
    const msg = encodeURIComponent(tokens.error_description ?? tokens.error ?? 'no_access_token')
    return NextResponse.redirect(`${appUrl}/admin/configuracoes?gcal=error&msg=${msg}`)
  }

  const expiry = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000)

  try {
    await db.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token ?? undefined,
        googleTokenExpiry: expiry,
        googleCalendarConnected: true,
      },
    })
  } catch (e) {
    const msg = encodeURIComponent(String(e))
    return NextResponse.redirect(`${appUrl}/admin/configuracoes?gcal=error&msg=${msg}`)
  }

  return NextResponse.redirect(`${appUrl}/admin/agenda?gcal=connected`)
}
