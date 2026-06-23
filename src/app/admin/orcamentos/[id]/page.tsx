import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { QuoteBuilder } from '@/components/builder/QuoteBuilder'
import { QuoteActions } from '@/components/builder/QuoteActions'
import type { QuoteBuilderState } from '@/types'

export default async function EditOrcamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const quote = await db.quote.findFirst({
    where: { id, userId: session!.user!.id! },
    include: { client: true, items: { orderBy: { order: 'asc' } }, sections: { orderBy: { order: 'asc' }, include: { images: { orderBy: { order: 'asc' } } } } },
  })
  if (!quote) notFound()

  const initialState: QuoteBuilderState = {
    title: quote.title,
    serialNumber: true,
    client: quote.client ? {
      id: quote.client.id,
      name: quote.client.name,
      email: quote.client.email ?? '',
      phone: quote.client.phone ?? '',
      company: quote.client.company ?? '',
      document: quote.client.document ?? '',
      address: quote.client.address ?? '',
    } : null,
    sections: quote.sections.map(s => ({
      id: s.id, type: s.type as 'TEXT' | 'IMAGES' | 'TERMS',
      title: s.title ?? '', content: s.content ?? '',
      order: s.order,
      images: s.images.map(img => ({ id: img.id, url: img.url, name: img.name ?? '', order: img.order })),
    })),
    items: quote.items.map(i => ({
      id: i.id, name: i.name, description: i.description ?? '',
      type: i.type as BuilderItem['type'], quantity: i.quantity, unit: i.unit ?? '',
      price: i.price, discount: i.discount, discountType: i.discountType as 'percent' | 'fixed',
      order: i.order,
    })),
    discount: quote.discount,
    discountType: quote.discountType as 'percent' | 'fixed',
    notes: quote.notes ?? '',
    contractTerms: (quote as Record<string, unknown>).contractTerms as string ?? '',
    observations: (quote as Record<string, unknown>).observations as string ?? '',
    validUntil: quote.validUntil ? quote.validUntil.toISOString().split('T')[0] : '',
    paymentMethods: (() => { try { return JSON.parse((quote as Record<string, unknown>).paymentMethods as string ?? '[]') } catch { return [] } })(),
  }

  const portalUrl = `${process.env.NEXTAUTH_URL}/orcamento/${quote.token}`

  return (
    <div className="h-full flex flex-col" style={{ background: '#1E1E1E' }}>
      <div className="px-8 py-4 border-b flex items-center justify-between" style={{ borderColor: '#2a2a2a' }}>
        <div className="flex items-center gap-2 text-sm">
          <a href="/admin/orcamentos" className="text-[#666] hover:text-white transition-colors">Orçamentos</a>
          <span className="text-[#444]">/</span>
          <span className="text-white">#{quote.number} — {quote.title}</span>
        </div>
        <QuoteActions quoteId={id} token={quote.token} status={quote.status} portalUrl={portalUrl} />
      </div>
      <div className="flex-1 overflow-hidden">
        <QuoteBuilder initialState={initialState} quoteId={id} />
      </div>
    </div>
  )
}

type BuilderItem = import('@/types').BuilderItem
