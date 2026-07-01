import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; linkId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: folderId, linkId } = await params

  const link = await db.swipeLink.findFirst({ where: { id: linkId, folderId, folder: { userId: session.user.id } } })
  if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.swipeLink.delete({ where: { id: linkId } })
  return NextResponse.json({ ok: true })
}
