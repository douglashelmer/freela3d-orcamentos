import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const lead = await db.lead.updateMany({
    where: { id, userId: session.user.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.email !== undefined && { email: body.email || null }),
      ...(body.phone !== undefined && { phone: body.phone || null }),
      ...(body.document !== undefined && { document: body.document || null }),
      ...(body.zipCode !== undefined && { zipCode: body.zipCode || null }),
      ...(body.address !== undefined && { address: body.address || null }),
      ...(body.neighborhood !== undefined && { neighborhood: body.neighborhood || null }),
      ...(body.city !== undefined && { city: body.city || null }),
      ...(body.state !== undefined && { state: body.state || null }),
      ...(body.project !== undefined && { project: body.project || null }),
      ...(body.estimatedValue !== undefined && { estimatedValue: body.estimatedValue ? Number(body.estimatedValue) : null }),
      ...(body.tags !== undefined && { tags: body.tags || null }),
      ...(body.notes !== undefined && { notes: body.notes || null }),
      ...(body.column !== undefined && { column: body.column }),
      ...(body.order !== undefined && { order: body.order }),
    },
  })
  return NextResponse.json(lead)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await db.lead.deleteMany({ where: { id, userId: session.user.id } })
  return NextResponse.json({ ok: true })
}
