import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  await db.appointment.updateMany({
    where: { id, userId: session.user.id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description || null }),
      ...(body.location !== undefined && { location: body.location || null }),
      ...(body.startAt !== undefined && { startAt: new Date(body.startAt) }),
      ...(body.endAt !== undefined && { endAt: body.endAt ? new Date(body.endAt) : null }),
      ...(body.allDay !== undefined && { allDay: body.allDay }),
      ...(body.color !== undefined && { color: body.color }),
    },
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await db.appointment.deleteMany({ where: { id, userId: session.user.id } })
  return NextResponse.json({ ok: true })
}
