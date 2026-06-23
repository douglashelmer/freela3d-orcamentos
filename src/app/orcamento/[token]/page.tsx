import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { formatCurrency, formatDate, calcItemTotal, calcQuoteTotal, ITEM_TYPE_LABELS } from '@/lib/utils'
import { PortalClient } from './PortalClient'

export default async function OrcamentoPortal({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const quote = await db.quote.findUnique({
    where: { token },
    include: {
      client: true,
      items: { orderBy: { order: 'asc' } },
      sections: { orderBy: { order: 'asc' }, include: { images: { orderBy: { order: 'asc' } } } },
    },
  })
  if (!quote) notFound()

  if (quote.status === 'SENT' || quote.status === 'DRAFT') {
    await db.quote.update({
      where: { id: quote.id },
      data: { status: 'VIEWED', viewedAt: new Date() },
    })
  }

  const { subtotal, discountAmount, total } = calcQuoteTotal(
    quote.items, quote.discount, quote.discountType
  )

  return (
    <PortalClient
      quote={{ ...quote, createdAt: quote.createdAt.toISOString(), validUntil: quote.validUntil?.toISOString() ?? null, signedAt: quote.signedAt?.toISOString() ?? null }}
      subtotal={subtotal}
      discountAmount={discountAmount}
      total={total}
    />
  )
}
