import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { calcQuoteTotal } from '@/lib/utils'
import { PortalClient } from './PortalClient'

const DEFAULT_PDF = {
  template: 'modern',
  primaryColor: '#1E1E1E',
  accentColor: '#D5FF40',
  bgMode: 'light',
  bgColor: '#FFFFFF',
  textColor: '#1A1A1A',
  pdfLogo: null,
  pdfBanner: null,
  bgImage: null,
  watermark: '',
  introText: '',
  termsText: '',
  footerText: '',
  blocks: { logo: true, validity: true, notes: true, contact: true },
}

export default async function OrcamentoPortal({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const quote = await db.quote.findUnique({
    where: { token },
    include: {
      client: true,
      items: { orderBy: { order: 'asc' } },
      sections: { orderBy: { order: 'asc' }, include: { images: { orderBy: { order: 'asc' } } } },
      user: { select: { logo: true, company: true, name: true, email: true, phone: true } },
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

  // Fetch PDF settings for the quote owner
  let pdfSettings = DEFAULT_PDF
  try {
    const rows = await db.$queryRaw<Array<{ pdfSettings: string | null }>>`
      SELECT "pdfSettings" FROM "User" WHERE id = ${quote.userId} LIMIT 1
    `
    const raw = rows[0]?.pdfSettings
    if (raw) pdfSettings = { ...DEFAULT_PDF, ...JSON.parse(raw), blocks: { ...DEFAULT_PDF.blocks, ...JSON.parse(raw).blocks } }
  } catch {
    // column not created yet, use defaults
  }

  const userContact = quote.user.email || quote.user.phone || null

  return (
    <PortalClient
      quote={{ ...quote, createdAt: quote.createdAt.toISOString(), validUntil: quote.validUntil?.toISOString() ?? null, signedAt: quote.signedAt?.toISOString() ?? null }}
      userLogo={quote.user.logo}
      userName={quote.user.company || quote.user.name}
      userContact={userContact}
      subtotal={subtotal}
      discountAmount={discountAmount}
      total={total}
      pdfSettings={pdfSettings}
    />
  )
}
