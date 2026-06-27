import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveInternalUser } from '@/lib/internal-auth'

export async function GET(req: Request) {
  const internalId = await resolveInternalUser(req)
  if (!internalId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const remoteJid = searchParams.get('remoteJid')
  if (!remoteJid) return NextResponse.json({ error: 'remoteJid required' }, { status: 400 })

  const session = await db.wppSession.findUnique({ where: { remoteJid } })
  if (!session) return NextResponse.json({ state: 'NONE' })

  return NextResponse.json({
    state: session.state,
    userId: session.userId ?? null,
    email: session.email ?? null,
  })
}

// Creates initial WAITING_EMAIL session, or resets expired code back to WAITING_EMAIL
export async function POST(req: Request) {
  const internalId = await resolveInternalUser(req)
  if (!internalId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { remoteJid, reset } = await req.json()
  if (!remoteJid) return NextResponse.json({ error: 'remoteJid required' }, { status: 400 })

  await db.wppSession.upsert({
    where: { remoteJid },
    create: { remoteJid, state: 'WAITING_EMAIL' },
    update: reset ? { state: 'WAITING_EMAIL', email: null, otp: null, otpExpiry: null } : {},
  })

  return NextResponse.json({ ok: true })
}
