import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)
  const appointments = await db.appointment.findMany({
    where: { userId: session.user.id, startAt: { gte: start, lt: end } },
    orderBy: { startAt: 'asc' },
  })
  return NextResponse.json(appointments)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const appointment = await db.appointment.create({
    data: {
      userId: session.user.id,
      title: body.title,
      description: body.description || null,
      location: body.location || null,
      startAt: new Date(body.startAt),
      endAt: body.endAt ? new Date(body.endAt) : null,
      allDay: body.allDay ?? false,
      color: body.color ?? '#60a5fa',
    },
  })
  return NextResponse.json(appointment, { status: 201 })
}
