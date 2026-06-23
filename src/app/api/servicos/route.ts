import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const services = await db.service.findMany({
    where: { userId: session.user.id },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })

  return NextResponse.json(services)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Suporte a criação em massa (array) ou individual (objeto)
  if (Array.isArray(body)) {
    const services = await db.service.createMany({
      data: body.map((s: { name: string; category: string; price: number; description?: string }) => ({
        userId: session.user!.id!,
        name: s.name,
        category: s.category,
        price: parseFloat(String(s.price)),
        description: s.description ?? null,
      })),
    })
    return NextResponse.json(services, { status: 201 })
  }

  const service = await db.service.create({
    data: {
      userId: session.user.id,
      name: body.name,
      category: body.category,
      price: parseFloat(String(body.price)),
      description: body.description ?? null,
    },
  })

  return NextResponse.json(service, { status: 201 })
}
