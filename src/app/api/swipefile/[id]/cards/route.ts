import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

async function assertOwnership(folderId: string, userId: string) {
  return db.swipeFolder.findFirst({ where: { id: folderId, userId } })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: folderId } = await params
  if (!(await assertOwnership(folderId, session.user.id))) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const card = await db.swipeCard.create({
    data: {
      folderId,
      type: body.type === 'IMAGE' ? 'IMAGE' : 'NOTE',
      content: body.content ?? '',
      color: body.color ?? null,
      x: body.x ?? 40,
      y: body.y ?? 40,
      w: body.w ?? 220,
      h: body.h ?? 160,
    },
  })
  return NextResponse.json(card, { status: 201 })
}
