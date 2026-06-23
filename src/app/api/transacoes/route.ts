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
  const end = new Date(year, month, 0, 23, 59, 59)
  const transactions = await db.transaction.findMany({
    where: { userId: session.user.id, dueDate: { gte: start, lte: end } },
    orderBy: { dueDate: 'asc' },
  })
  return NextResponse.json(transactions)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const tx = await db.transaction.create({
    data: {
      userId: session.user.id,
      type: body.type,
      description: body.description,
      amount: Number(body.amount),
      dueDate: new Date(body.dueDate),
      paidAt: body.paidAt ? new Date(body.paidAt) : null,
      status: body.status ?? 'PENDING',
      category: body.category || null,
      notes: body.notes || null,
    },
  })
  return NextResponse.json(tx, { status: 201 })
}
