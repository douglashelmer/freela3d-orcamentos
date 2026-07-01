import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const folders = await db.swipeFolder.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { cards: true, links: true } } },
  })
  return NextResponse.json(folders)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const folder = await db.swipeFolder.create({
    data: { userId: session.user.id, name: body.name.trim(), color: body.color ?? null },
  })
  return NextResponse.json(folder, { status: 201 })
}
