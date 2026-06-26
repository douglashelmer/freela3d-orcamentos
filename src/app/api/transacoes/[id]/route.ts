import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { sendPushToUser } from '@/lib/push'
import { checkMilestones } from '@/lib/milestones'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  // Fetch current status before update to detect PAID transition
  const before = await db.transaction.findFirst({ where: { id, userId: session.user.id }, select: { status: true, description: true, amount: true, type: true } })

  const tx = await db.transaction.updateMany({
    where: { id, userId: session.user.id },
    data: {
      ...(body.description !== undefined && { description: body.description }),
      ...(body.amount !== undefined && { amount: Number(body.amount) }),
      ...(body.dueDate !== undefined && { dueDate: new Date(body.dueDate) }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.paidAt !== undefined && { paidAt: body.paidAt ? new Date(body.paidAt) : null }),
      ...(body.category !== undefined && { category: body.category || null }),
      ...(body.notes !== undefined && { notes: body.notes || null }),
    },
  })

  // Push on PAID transition
  if (before && before.status !== 'PAID' && body.status === 'PAID' && before.type === 'INCOME') {
    const amt = (body.amount !== undefined ? Number(body.amount) : before.amount)
      .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    sendPushToUser(session.user.id, {
      title: '💰 Pagamento recebido!',
      body: `${before.description} · ${amt}`,
      url: '/admin/financeiro',
    }).catch(() => {})
    checkMilestones(session.user.id).catch(() => {})
  }

  return NextResponse.json(tx)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await db.transaction.deleteMany({ where: { id, userId: session.user.id } })
  return NextResponse.json({ ok: true })
}
