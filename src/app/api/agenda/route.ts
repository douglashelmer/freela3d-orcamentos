import { auth } from '@/auth'
import { db } from '@/lib/db'
import { resolveInternalUser } from '@/lib/internal-auth'
import { sendPushToUser } from '@/lib/push'
import { BR_TZ, brDateTimeToISO } from '@/lib/tz'
import { NextResponse } from 'next/server'

function firstOfMonthISO(year: number, month: number) {
  // month is 1-based here; roll over to next year when month is 13
  const y = month > 12 ? year + 1 : year
  const m = ((month - 1) % 12) + 1
  return brDateTimeToISO(`${y}-${String(m).padStart(2, '0')}-01`, '00:00')
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))
  const start = new Date(firstOfMonthISO(year, month))
  const end = new Date(firstOfMonthISO(year, month + 1))
  const appointments = await db.appointment.findMany({
    where: { userId: session.user.id, startAt: { gte: start, lt: end } },
    orderBy: { startAt: 'asc' },
  })
  return NextResponse.json(appointments)
}

export async function POST(req: Request) {
  const session = await auth()
  const internalId = !session?.user?.id ? await resolveInternalUser(req) : null
  const userId = session?.user?.id ?? internalId
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const appointment = await db.appointment.create({
    data: {
      userId,
      title: body.title,
      description: body.description || null,
      location: body.location || null,
      startAt: new Date(body.startAt),
      endAt: body.endAt ? new Date(body.endAt) : null,
      allDay: body.allDay ?? false,
      color: body.color ?? '#60a5fa',
    },
  })
  const timeStr = appointment.allDay
    ? 'dia todo'
    : appointment.startAt.toLocaleTimeString('pt-BR', { timeZone: BR_TZ, hour: '2-digit', minute: '2-digit' })

  sendPushToUser(userId, {
    title: '📅 Novo evento na agenda',
    body: `${appointment.title} — ${timeStr}`,
    url: '/admin/agenda',
  }).catch(() => {})

  return NextResponse.json(appointment, { status: 201 })
}
