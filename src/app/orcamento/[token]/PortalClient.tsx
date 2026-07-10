'use client'

import { useEffect, useState } from 'react'
import { SignaturePad } from '@/components/portal/SignaturePad'
import { formatCurrency, formatDate, calcItemTotal, ITEM_TYPE_LABELS } from '@/lib/utils'

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128
}

type PdfSettings = {
  template: string
  primaryColor: string
  accentColor: string
  bgMode: string
  bgColor: string
  textColor: string
  pdfLogo: string | null
  pdfBanner: string | null
  bgImage: string | null
  watermark: string
  introText: string
  termsText: string
  footerText: string
  blocks: { logo: boolean; validity: boolean; notes: boolean; contact: boolean }
}

type PortalSettings = {
  logo: string | null
  favicon: string | null
  primaryColor: string
  secondaryColor: string
}

interface Props {
  quote: {
    token: string
    number: string
    title: string
    status: string
    discount: number
    discountType: string
    notes: string | null
    validUntil: string | null
    signedAt: string | null
    signedByName: string | null
    signatureData: string | null
    createdAt: string
    client: { name: string; email: string | null; company: string | null } | null
    sections: Array<{
      id: string; type: string; title: string | null; content: string | null
      images: Array<{ id: string; url: string; name: string | null }>
    }>
    items: Array<{
      id: string; name: string; description: string | null; type: string
      quantity: number; price: number; discount: number; discountType: string
    }>
  }
  userLogo: string | null
  userName: string | null
  userContact: string | null
  subtotal: number
  discountAmount: number
  total: number
  pdfSettings: PdfSettings
  portalSettings: PortalSettings
}

export function PortalClient({ quote, userLogo, userName, userContact, subtotal, discountAmount, total, pdfSettings: pdf, portalSettings: portal }: Props) {
  const [signed, setSigned] = useState(quote.status === 'SIGNED')

  const isSigned = signed || quote.status === 'SIGNED'

  // auto-print when ?print=1 is in URL
  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('print') === '1') {
      setTimeout(() => window.print(), 800)
    }
  }, [])

  const effectiveLogo = portal.logo ?? pdf.pdfLogo ?? userLogo
  const portalGrad = `linear-gradient(135deg, ${portal.primaryColor}, ${portal.secondaryColor})`

  // Build print CSS from pdfSettings
  const printCSS = `
    @media print {
      .no-print { display: none !important; }
      body { background: ${pdf.bgColor} !important; color: ${pdf.textColor} !important; }
      .print-root { background: ${pdf.bgColor} !important; }
      header { position: static !important; background: ${pdf.primaryColor} !important; border: none !important; backdrop-filter: none !important; }
      .pdf-header-logo { color: ${pdf.primaryColor === '#FFFFFF' ? '#1A1A1A' : '#FFFFFF'} !important; filter: brightness(${pdf.primaryColor === '#FFFFFF' ? 0 : 100}) !important; }
      .pdf-number { color: ${pdf.accentColor} !important; }
      .print-card { background: ${pdf.bgMode === 'dark' ? '#1c1b1e' : '#f8f8f8'} !important; border-color: ${pdf.bgMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e5e7eb'} !important; }
      .pdf-table-header td, .pdf-table-header th { background: ${pdf.accentColor} !important; color: ${isLightColor(pdf.accentColor) ? '#1A1A1A' : '#FFFFFF'} !important; }
      .pdf-total-value { color: ${pdf.accentColor} !important; }
      .pdf-total-row { background: ${pdf.accentColor}22 !important; }
      ${!pdf.blocks.logo ? '.pdf-logo-wrap { display: none !important; }' : ''}
      ${!pdf.blocks.validity ? '.pdf-validity { display: none !important; }' : ''}
      ${!pdf.blocks.notes ? '.pdf-notes { display: none !important; }' : ''}
      ${!pdf.blocks.contact ? '.pdf-contact { display: none !important; }' : ''}
      ${pdf.bgImage ? `body { background-image: url(${pdf.bgImage}) !important; background-size: cover !important; background-position: center !important; }` : ''}
      ${pdf.watermark ? `
        body::after {
          content: '${pdf.watermark.replace(/'/g, "\\'")}';
          position: fixed; top: 50%; left: 50%;
          transform: translate(-50%, -50%) rotate(-35deg);
          font-size: 80px; font-weight: 900; opacity: 0.06;
          color: ${pdf.textColor}; pointer-events: none; z-index: 9999;
          white-space: nowrap;
        }
      ` : ''}
    }
  `

  return (
    <>
      <style>{printCSS}</style>

      <div className="min-h-screen print-root" style={{ background: '#09090a' }}>
        {/* Header */}
        <header className="border-b sticky top-0 z-10 backdrop-blur-sm" style={{ borderColor: '#1c1b1e', background: 'rgba(30,30,30,0.95)' }}>
          {pdf.pdfBanner && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pdf.pdfBanner} alt="" className="w-full object-cover no-print" style={{ maxHeight: 80 }} />
          )}
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="pdf-logo-wrap">
              {effectiveLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={effectiveLogo} alt={userName ?? ''} className="h-8 object-contain max-w-[160px] pdf-header-logo" />
              ) : (
                <span className="text-white font-bold text-lg pdf-header-logo">{userName ?? 'Atlaz'}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-[#6e6a60]">Orçamento</p>
                <p className="text-sm font-bold pdf-number" style={{ color: portal.primaryColor }}>#{quote.number}</p>
              </div>
              <button
                onClick={() => window.print()}
                className="no-print flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-[rgba(255,255,255,0.1)] text-[#a8a296] hover:text-white hover:border-[#6e6a60] transition-all"
              >
                📄 Salvar PDF
              </button>
              <button
                onClick={() => window.history.back()}
                className="no-print flex items-center justify-center w-9 h-9 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#a8a296] hover:text-white hover:border-[#6e6a60] transition-all text-lg leading-none"
                title="Fechar"
              >
                ✕
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-8">

          {/* Proposta Comercial badge */}
          <div className="flex justify-center">
            <span className="text-sm px-4 py-1.5 rounded-full font-semibold text-white" style={{ background: portalGrad }}>
              ✦ Proposta Comercial
            </span>
          </div>

          {/* Status banner */}
          {isSigned && (
            <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: portalGrad }}>
              <span className="text-3xl">✓</span>
              <div>
                <p className="font-bold text-[#09090a] text-lg">Orçamento aprovado!</p>
                <p className="text-sm text-[#09090a]/70">
                  Assinado por {quote.signedByName} em {quote.signedAt ? formatDate(quote.signedAt) : '—'}
                </p>
              </div>
            </div>
          )}

          {/* Title & Client */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{quote.title}</h1>
            {quote.client && (
              <p className="text-[#a8a296]">
                Para: <strong className="text-white">{quote.client.name}</strong>
                {quote.client.company && <span className="text-[#6e6a60]"> · {quote.client.company}</span>}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-[#6e6a60]">
              <span>Criado em {formatDate(quote.createdAt)}</span>
              {quote.validUntil && <span className="pdf-validity">· Válido até {formatDate(quote.validUntil)}</span>}
            </div>
          </div>

          {/* Intro text (PDF only) */}
          {pdf.introText && (
            <div className="rounded-2xl border p-5 print-card" style={{ background: '#161518', borderColor: 'rgba(255,255,255,0.1)' }}>
              <p className="text-[#ccc] text-sm leading-relaxed whitespace-pre-wrap">{pdf.introText}</p>
            </div>
          )}

          {/* Sections */}
          {quote.sections.map(sec => (
            <div key={sec.id} className="rounded-2xl border p-6 print-card" style={{ background: '#161518', borderColor: 'rgba(255,255,255,0.1)' }}>
              {sec.title && <h2 className="text-base font-semibold text-white mb-4">{sec.title}</h2>}

              {sec.type === 'TEXT' && sec.content && (
                <p className="text-[#ccc] text-sm leading-relaxed whitespace-pre-wrap">{sec.content}</p>
              )}

              {sec.type === 'IMAGES' && sec.images.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {sec.images.map(img => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={img.id} src={img.url} alt={img.name ?? ''} className="rounded-xl w-full object-cover aspect-video" />
                  ))}
                </div>
              )}

              {sec.type === 'TERMS' && sec.content && (
                <p className="text-[#a8a296] text-sm leading-relaxed whitespace-pre-wrap">{sec.content}</p>
              )}
            </div>
          ))}

          {/* Price Table */}
          {quote.items.length > 0 && (
            <div className="rounded-2xl border overflow-hidden print-card" style={{ background: '#161518', borderColor: 'rgba(255,255,255,0.1)' }}>
              <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <h2 className="font-semibold text-white">Serviços e Valores</h2>
              </div>

              <div className="divide-y" style={{ borderColor: '#1c1b1e' }}>
                {quote.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      {item.description && <p className="text-xs text-[#6e6a60] mt-0.5">{item.description}</p>}
                      <p className="text-xs text-[#6e6a60] mt-1">
                        {ITEM_TYPE_LABELS[item.type]} · {item.quantity}x {formatCurrency(item.price)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-white ml-6">
                      {formatCurrency(calcItemTotal(item))}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t divide-y" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <div className="flex justify-between px-6 py-3 text-sm text-[#a8a296]">
                  <span>Subtotal</span><span className="text-white">{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between px-6 py-3 text-sm text-red-400">
                    <span>Desconto</span><span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="pdf-total-row flex justify-between px-6 py-4 font-bold text-lg" style={{ background: '#1c1b1e' }}>
                  <span className="text-white">Total</span>
                  <span className="pdf-total-value" style={{ color: portal.primaryColor }}>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Signature Section */}
          {!isSigned && (
            <div className="rounded-2xl border p-6 no-print" style={{ background: '#161518', borderColor: 'rgba(255,255,255,0.1)' }}>
              <SignaturePad token={quote.token} total={total} onSigned={() => setSigned(true)} />
            </div>
          )}

          {/* Signed signature display */}
          {isSigned && quote.signatureData && (
            <div className="rounded-2xl border p-6 print-card" style={{ background: '#161518', borderColor: 'rgba(255,255,255,0.1)' }}>
              <p className="text-xs text-[#6e6a60] uppercase tracking-wide font-mono mb-4">Assinatura registrada</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={quote.signatureData} alt="Assinatura" className="max-h-24 opacity-80" />
              <p className="text-sm text-[#a8a296] mt-2">{quote.signedByName}</p>
            </div>
          )}

        </main>

        {/* Terms text */}
        {pdf.termsText && (
          <div className="pdf-notes rounded-2xl border p-5 print-card" style={{ background: '#161518', borderColor: 'rgba(255,255,255,0.1)' }}>
            <p className="text-xs text-[#a8a296] uppercase tracking-wide font-mono mb-2">Observações</p>
            <p className="text-[#aaa] text-sm leading-relaxed whitespace-pre-wrap">{pdf.termsText}</p>
          </div>
        )}

        <footer className="border-t mt-16 py-8 text-center" style={{ borderColor: '#1c1b1e' }}>
          {(pdf.footerText || (pdf.blocks.contact && userContact)) && (
            <p className="pdf-contact text-xs text-[#6e6a60] mb-2">{pdf.footerText || userContact}</p>
          )}
          <p className="text-xs text-[rgba(255,255,255,0.16)]">Gerado por <strong className="text-[#e8b84b]">projetoatlaz.com</strong></p>
        </footer>
      </div>
    </>
  )
}
