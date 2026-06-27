import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveInternalUser } from '@/lib/internal-auth'

export async function POST(req: Request) {
  const internalId = await resolveInternalUser(req)
  if (!internalId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { remoteJid, code } = await req.json()
  if (!remoteJid || !code) return NextResponse.json({ error: 'remoteJid and code required' }, { status: 400 })

  const session = await db.wppSession.findUnique({ where: { remoteJid } })
  if (!session || session.state !== 'WAITING_CODE') {
    return NextResponse.json({ error: 'INVALID_STATE' }, { status: 400 })
  }

  if (!session.otp || !session.otpExpiry || session.otp !== code.trim()) {
    return NextResponse.json({ error: 'INVALID_CODE' }, { status: 400 })
  }

  if (new Date() > session.otpExpiry) {
    return NextResponse.json({ error: 'CODE_EXPIRED' }, { status: 400 })
  }

  // Link to user or client
  const user = session.email
    ? await db.user.findFirst({ where: { email: session.email }, select: { id: true, name: true } })
    : null

  await db.wppSession.update({
    where: { remoteJid },
    data: {
      state: 'AUTHENTICATED',
      userId: user?.id ?? null,
      otp: null,
      otpExpiry: null,
    },
  })

  return NextResponse.json({ ok: true, userId: user?.id ?? null, name: user?.name ?? null })
}
