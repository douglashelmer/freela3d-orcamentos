import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendPushToUser } from '@/lib/push'

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { signatureData, signedByName, signedByDoc } = await req.json()

  const quote = await db.quote.findUnique({ where: { token } })
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (quote.status === 'SIGNED') return NextResponse.json({ error: 'Already signed' }, { status: 400 })
  if (quote.status === 'DECLINED') return NextResponse.json({ error: 'Quote declined' }, { status: 400 })

  await db.quote.update({
    where: { token },
    data: {
      status: 'SIGNED',
      signedAt: new Date(),
      signatureData,
      signedByName,
      signedByDoc: signedByDoc || null,
    },
  })

  // Push notification
  sendPushToUser(quote.userId, {
    title: '✅ Orçamento assinado!',
    body: `${quote.title} foi aprovado por ${signedByName}`,
    url: `/admin/orcamentos/${quote.id}`,
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
