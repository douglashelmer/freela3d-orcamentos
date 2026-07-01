import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const folder = await db.swipeFolder.findFirst({
    where: { id, userId: session.user.id },
    include: {
      cards: { orderBy: { createdAt: 'asc' } },
      links: { orderBy: { createdAt: 'desc' } },
    },
  })
  if (!folder) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(folder)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  const folder = await db.swipeFolder.findFirst({ where: { id, userId: session.user.id } })
  if (!folder) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await db.swipeFolder.update({
    where: { id },
    data: {
      name: body.name?.trim() || undefined,
      color: body.color ?? undefined,
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const folder = await db.swipeFolder.findFirst({ where: { id, userId: session.user.id } })
  if (!folder) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.swipeFolder.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
