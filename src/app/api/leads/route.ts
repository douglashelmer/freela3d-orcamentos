import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const leads = await db.lead.findMany({
    where: { userId: session.user.id },
    orderBy: [{ column: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }],
  })
  return NextResponse.json(leads)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const lead = await db.lead.create({
    data: {
      userId: session.user.id,
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      document: body.document || null,
      zipCode: body.zipCode || null,
      address: body.address || null,
      neighborhood: body.neighborhood || null,
      city: body.city || null,
      state: body.state || null,
      project: body.project || null,
      estimatedValue: body.estimatedValue ? Number(body.estimatedValue) : null,
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
      tags: body.tags || null,
      notes: body.notes || null,
      column: body.column || 'NEW',
      order: body.order ?? 0,
    },
  })
  return NextResponse.json(lead, { status: 201 })
}
