import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const clients = await db.client.findMany({
    where: { quotes: { some: { userId: session.user.id } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(clients)
}
