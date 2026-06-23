import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import type { QuoteBuilderState } from '@/types'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const quote = await db.quote.findFirst({
    where: { id, userId: session.user.id },
    include: { client: true, items: { orderBy: { order: 'asc' } }, sections: { include: { images: true }, orderBy: { order: 'asc' } } },
  })
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(quote)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await db.quote.findFirst({ where: { id, userId: session.user.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body: QuoteBuilderState & { status?: string } = await req.json()

  let clientId = existing.clientId

  if (body.client?.name && body.client.id) {
    await db.client.update({
      where: { id: body.client.id },
      data: {
        name: body.client.name,
        email: body.client.email || null,
        phone: body.client.phone || null,
        company: body.client.company || null,
        document: body.client.document || null,
        address: body.client.address || null,
      },
    })
    clientId = body.client.id
  } else if (body.client?.name && !body.client.id) {
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

  await db.section.deleteMany({ where: { quoteId: id } })
  await db.quoteItem.deleteMany({ where: { quoteId: id } })

  const quote = await db.quote.update({
    where: { id },
    data: {
      title: body.title || 'Sem título',
      status: (body.status as 'DRAFT' | 'SENT') ?? existing.status,
      clientId,
      discount: body.discount ?? 0,
      discountType: body.discountType ?? 'percent',
      notes: body.notes || null,
      contractTerms: body.contractTerms || null,
      observations: body.observations || null,
      paymentMethods: body.paymentMethods?.length ? JSON.stringify(body.paymentMethods) : null,
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
      sentAt: body.status === 'SENT' && !existing.sentAt ? new Date() : existing.sentAt,
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
  return NextResponse.json(quote)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await db.quote.deleteMany({ where: { id, userId: session.user.id } })
  return NextResponse.json({ ok: true })
}
