import { auth } from '@/auth'
import { db } from '@/lib/db'
import { resolveInternalUser } from '@/lib/internal-auth'
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
  const internalId = !session?.user?.id ? await resolveInternalUser(req) : null
  const userId = session?.user?.id ?? internalId
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const task = await db.task.create({
    data: {
      userId,
      title: body.title,
      description: body.description || null,
      column: body.column ?? 'TODO',
      priority: body.priority ?? 'MEDIUM',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      tags: body.tags || null,
      imageUrl: body.imageUrl || null,
      links: body.links || null,
      order: body.order ?? 0,
    },
  })
  return NextResponse.json(task, { status: 201 })
}
