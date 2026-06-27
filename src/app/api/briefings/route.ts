import { auth } from '@/auth'
import { db } from '@/lib/db'
import { resolveInternalUser } from '@/lib/internal-auth'
import { sendPushToUser } from '@/lib/push'
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
  const internalId = !session?.user?.id ? await resolveInternalUser(req) : null
  const userId = session?.user?.id ?? internalId
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const token = nanoid(32)
  const briefing = await db.briefing.create({
    data: {
      userId,
      token,
      type: body.type ?? 'OTHER',
      clientName: body.clientName,
      clientEmail: body.clientEmail,
      quoteId: body.quoteId || null,
      status: 'PENDING',
    },
  })
  sendPushToUser(userId, {
    title: '📝 Briefing criado',
    body: `${briefing.clientName} — ${briefing.clientEmail}`,
    url: `/admin/briefings/${briefing.id}`,
  }).catch(() => {})

  return NextResponse.json(briefing, { status: 201 })
}
