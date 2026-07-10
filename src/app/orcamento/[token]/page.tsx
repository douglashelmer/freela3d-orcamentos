import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { calcQuoteTotal } from '@/lib/utils'
import { PortalClient } from './PortalClient'
import { sendPushToUser } from '@/lib/push'

const DEFAULT_PDF = {
  template: 'modern',
  primaryColor: '#09090a',
  accentColor: '#e8b84b',
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
    // Push notification — don't await (fire and forget)
    sendPushToUser(quote.userId, {
      title: '👁 Orçamento visualizado',
      body: `${quote.client?.name ?? 'Seu cliente'} abriu "${quote.title}"`,
      url: `/admin/orcamentos/${quote.id}`,
    }).catch(() => {})
  }

  const { subtotal, discountAmount, total } = calcQuoteTotal(
    quote.items, quote.discount, quote.discountType
  )

  const DEFAULT_PORTAL = { logo: null as string | null, favicon: null as string | null, primaryColor: '#e8b84b', secondaryColor: '#a3e635' }

  // Fetch PDF + portal settings for the quote owner
  let pdfSettings = DEFAULT_PDF
  let portalSettings = DEFAULT_PORTAL
  try {
    const rows = await db.$queryRaw<Array<{ pdfSettings: string | null; portalSettings: string | null }>>`
      SELECT "pdfSettings", "portalSettings" FROM "User" WHERE id = ${quote.userId} LIMIT 1
    `
    const rawPdf = rows[0]?.pdfSettings
    const rawPortal = rows[0]?.portalSettings
    if (rawPdf) pdfSettings = { ...DEFAULT_PDF, ...JSON.parse(rawPdf), blocks: { ...DEFAULT_PDF.blocks, ...JSON.parse(rawPdf).blocks } }
    if (rawPortal) portalSettings = { ...DEFAULT_PORTAL, ...JSON.parse(rawPortal) }
  } catch {
    // columns not created yet, use defaults
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
      portalSettings={portalSettings}
    />
  )
}
