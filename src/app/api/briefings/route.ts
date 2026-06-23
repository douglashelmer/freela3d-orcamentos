import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const briefings = await db.briefing.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(briefings)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const token = nanoid(32)
  const briefing = await db.briefing.create({
    data: {
      userId: session.user.id,
      token,
      type: body.type ?? 'OTHER',
      clientName: body.clientName,
      clientEmail: body.clientEmail,
      quoteId: body.quoteId || null,
      status: 'PENDING',
    },
  })
  return NextResponse.json(briefing, { status: 201 })
}
