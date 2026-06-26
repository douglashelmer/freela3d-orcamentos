import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint, keys } = await req.json()
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
  }

  try {
    await db.$executeRaw`
      INSERT INTO "PushSubscription" (id, "userId", endpoint, p256dh, auth)
      VALUES (${nanoid()}, ${session.user.id}, ${endpoint}, ${keys.p256dh}, ${keys.auth})
      ON CONFLICT (endpoint) DO UPDATE SET "userId" = ${session.user.id}
    `
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint } = await req.json()
  if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })

  try {
    await db.$executeRaw`
      DELETE FROM "PushSubscription" WHERE endpoint = ${endpoint} AND "userId" = ${session.user.id}
    `
  } catch {}

  return NextResponse.json({ ok: true })
}
