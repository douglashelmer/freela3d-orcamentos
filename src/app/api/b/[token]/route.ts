import { db } from '@/lib/db'
import { sendPushToUser } from '@/lib/push'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const briefing = await db.briefing.findUnique({
    where: { token },
    select: {
      id: true, token: true, type: true, clientName: true, status: true,
      user: { select: { name: true, company: true, logo: true } },
    },
  })
  if (!briefing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(briefing)
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const briefing = await db.briefing.findUnique({ where: { token } })
  if (!briefing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (briefing.status === 'RESPONDED') return NextResponse.json({ error: 'Already responded' }, { status: 400 })

  const body = await req.json()
  await db.briefing.update({
    where: { token },
    data: {
      projectType: body.projectType || null,
      description: body.description || null,
      references: body.references || null,
      deadline: body.deadline || null,
      budget: body.budget || null,
      status: 'RESPONDED',
      answeredAt: new Date(),
    },
  })
  sendPushToUser(briefing.userId, {
    title: '✅ Briefing respondido!',
    body: `${briefing.clientName} preencheu o formulário`,
    url: `/admin/briefings/${briefing.id}`,
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
