import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const service = await db.service.findUnique({ where: { id } })
  if (!service || service.userId !== session.user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await db.service.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.price !== undefined && { price: parseFloat(String(body.price)) }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.active !== undefined && { active: body.active }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const service = await db.service.findUnique({ where: { id } })
  if (!service || service.userId !== session.user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.service.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
