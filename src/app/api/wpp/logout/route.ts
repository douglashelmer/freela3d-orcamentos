import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveInternalUser } from '@/lib/internal-auth'

// DELETE /api/wpp/logout?remoteJid=xxx  — revoke session (license expiry etc)
export async function DELETE(req: Request) {
  const internalId = await resolveInternalUser(req)
  if (!internalId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const remoteJid = searchParams.get('remoteJid')
  if (!remoteJid) return NextResponse.json({ error: 'remoteJid required' }, { status: 400 })

  await db.wppSession.deleteMany({ where: { remoteJid } })
  return NextResponse.json({ ok: true })
}
