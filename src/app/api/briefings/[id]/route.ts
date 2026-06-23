import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const briefing = await db.briefing.findFirst({ where: { id, userId: session.user.id } })
  if (!briefing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(briefing)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await db.briefing.deleteMany({ where: { id, userId: session.user.id } })
  return NextResponse.json({ ok: true })
}
