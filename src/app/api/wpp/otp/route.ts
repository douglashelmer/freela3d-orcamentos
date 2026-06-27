import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveInternalUser } from '@/lib/internal-auth'
import { sendOtpEmail } from '@/lib/email'

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function POST(req: Request) {
  const internalId = await resolveInternalUser(req)
  if (!internalId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { remoteJid, email } = await req.json()
  if (!remoteJid || !email) return NextResponse.json({ error: 'remoteJid and email required' }, { status: 400 })

  const normalized = email.trim().toLowerCase()

  // Check User table first, then Client table
  const user = await db.user.findFirst({ where: { email: normalized }, select: { id: true, email: true } })
  const client = !user
    ? await db.client.findFirst({ where: { email: normalized }, select: { id: true, email: true } })
    : null

  if (!user && !client) {
    return NextResponse.json({ error: 'EMAIL_NOT_FOUND' }, { status: 404 })
  }

  const otp = generateOtp()
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  await db.wppSession.upsert({
    where: { remoteJid },
    create: { remoteJid, email: normalized, otp, otpExpiry, state: 'WAITING_CODE' },
    update: { email: normalized, otp, otpExpiry, state: 'WAITING_CODE' },
  })

  await sendOtpEmail(normalized, otp)

  return NextResponse.json({ ok: true, email: normalized })
}
