import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { generateToken } from '@/lib/utils'

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const original = await db.quote.findFirst({
    where: { id, userId: session.user.id },
    include: {
      items: { orderBy: { order: 'asc' } },
      sections: { orderBy: { order: 'asc' }, include: { images: { orderBy: { order: 'asc' } } } },
    },
  })

  if (!original) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const count = await db.quote.count({ where: { userId: session.user.id } })
  const number = String(count + 1).padStart(3, '0')

  const copy = await db.quote.create({
    data: {
      token: generateToken(),
      number,
      title: `${original.title} (cópia)`,
      status: 'DRAFT',
      userId: session.user.id,
      clientId: original.clientId,
      discount: original.discount,
      discountType: original.discountType,
      notes: original.notes,
      contractTerms: original.contractTerms,
      observations: original.observations,
      paymentMethods: original.paymentMethods,
      validUntil: original.validUntil,
      sections: {
        create: original.sections.map(s => ({
          type: s.type,
          title: s.title,
          content: s.content,
          order: s.order,
          images: {
            create: s.images.map(img => ({ url: img.url, name: img.name, order: img.order })),
          },
        })),
      },
      items: {
        create: original.items.map(item => ({
          name: item.name,
          description: item.description,
          type: item.type,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          discount: item.discount,
          discountType: item.discountType,
          order: item.order,
        })),
      },
    },
  })

  return NextResponse.json({ id: copy.id })
}
