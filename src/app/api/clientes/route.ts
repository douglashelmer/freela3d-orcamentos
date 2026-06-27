import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { resolveInternalUser } from '@/lib/internal-auth'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const clients = await db.client.findMany({
    where: {
      OR: [
        { quotes: { some: { userId: session.user.id } } },
        { userId: session.user.id },
      ],
    },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(clients)
}

export async function POST(req: Request) {
  const session = await auth()
  const internalId = !session?.user?.id ? await resolveInternalUser(req) : null
  const userId = session?.user?.id ?? internalId
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const client = await db.client.create({
    data: {
      userId,
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      company: body.company || null,
      document: body.document || null,
      notes: body.notes || null,
    },
  })
  return NextResponse.json(client, { status: 201 })
}
