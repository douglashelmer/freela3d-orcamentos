import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

async function findOwnedCard(folderId: string, cardId: string, userId: string) {
  return db.swipeCard.findFirst({ where: { id: cardId, folderId, folder: { userId } } })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; cardId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: folderId, cardId } = await params
  if (!(await findOwnedCard(folderId, cardId, session.user.id))) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const data: Record<string, unknown> = {}
  for (const key of ['content', 'color'] as const) if (body[key] !== undefined) data[key] = body[key]
  for (const key of ['x', 'y', 'w', 'h', 'zIndex'] as const) if (body[key] !== undefined) data[key] = Number(body[key])

  const updated = await db.swipeCard.update({ where: { id: cardId }, data })
  return NextResponse.json(updated)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; cardId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: folderId, cardId } = await params
  if (!(await findOwnedCard(folderId, cardId, session.user.id))) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.swipeCard.delete({ where: { id: cardId } })
  return NextResponse.json({ ok: true })
}
