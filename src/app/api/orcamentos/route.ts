import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { sendPushToUser } from '@/lib/push'
import { generateToken } from '@/lib/utils'
import type { QuoteBuilderState } from '@/types'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const quotes = await db.quote.findMany({
    where: { userId: session.user.id },
    include: { client: true, items: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(quotes)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: QuoteBuilderState & { status?: string } = await req.json()

  const count = await db.quote.count({ where: { userId: session.user.id } })
  const number = String(count + 1).padStart(3, '0')

  let clientId: string | undefined
  if (body.client?.name) {
    const c = await db.client.create({
      data: {
        name: body.client.name,
        email: body.client.email || null,
        phone: body.client.phone || null,
        company: body.client.company || null,
        document: body.client.document || null,
        address: body.client.address || null,
      },
    })
    clientId = c.id
  }

  const quote = await db.quote.create({
    data: {
      token: generateToken(),
      number,
      title: body.title || 'Sem título',
      status: (body.status as 'DRAFT' | 'SENT') ?? 'DRAFT',
      userId: session.user.id,
      clientId,
      discount: body.discount ?? 0,
      discountType: body.discountType ?? 'percent',
      notes: body.notes || null,
      contractTerms: body.contractTerms || null,
      observations: body.observations || null,
      paymentMethods: body.paymentMethods?.length ? JSON.stringify(body.paymentMethods) : null,
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
      sentAt: body.status === 'SENT' ? new Date() : null,
      sections: {
        create: body.sections.map((s, i) => ({
          type: s.type,
          title: s.title || null,
          content: s.content || null,
          order: i,
          images: {
            create: s.images.map((img, j) => ({ url: img.url, name: img.name, order: j })),
          },
        })),
      },
      items: {
        create: body.items.map((item, i) => ({
          name: item.name,
          description: item.description || null,
          type: item.type,
          quantity: item.quantity,
          unit: item.unit || null,
          price: item.price,
          discount: item.discount,
          discountType: item.discountType,
          order: i,
        })),
      },
    },
  })

  sendPushToUser(session.user.id, {
    title: '📋 Orçamento criado',
    body: `#${quote.number} — ${quote.title}`,
    url: `/admin/orcamentos/${quote.id}`,
  }).catch(() => {})

  return NextResponse.json(quote)
}
