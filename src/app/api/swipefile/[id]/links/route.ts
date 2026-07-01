import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: folderId } = await params
  const folder = await db.swipeFolder.findFirst({ where: { id: folderId, userId: session.user.id } })
  if (!folder) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  let url = String(body.url ?? '').trim()
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`

  const link = await db.swipeLink.create({
    data: { folderId, url, title: body.title?.trim() || null, note: body.note?.trim() || null },
  })
  return NextResponse.json(link, { status: 201 })
}
