import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    await db.$executeRaw`
      UPDATE "Contract" SET status = 'SENT'
      WHERE id = ${id} AND "userId" = ${session.user.id} AND COALESCE(status, 'DRAFT') = 'DRAFT'
    `
  } catch {}
  return NextResponse.json({ ok: true })
}
