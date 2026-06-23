import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tasks = await db.task.findMany({
    where: { userId: session.user.id },
    orderBy: [{ column: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }],
  })
  return NextResponse.json(tasks)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const task = await db.task.create({
    data: {
      userId: session.user.id,
      title: body.title,
      description: body.description || null,
      column: body.column ?? 'TODO',
      priority: body.priority ?? 'MEDIUM',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      tags: body.tags || null,
      order: body.order ?? 0,
    },
  })
  return NextResponse.json(task, { status: 201 })
}
