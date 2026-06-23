'use client'

import { useState } from 'react'
import Image from 'next/image'
import { SignaturePad } from '@/components/portal/SignaturePad'
import { formatCurrency, formatDate, calcItemTotal, ITEM_TYPE_LABELS } from '@/lib/utils'

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
  subtotal: number
  discountAmount: number
  total: number
}

export function PortalClient({ quote, subtotal, discountAmount, total }: Props) {
  const [signed, setSigned] = useState(quote.status === 'SIGNED')

  const isSigned = signed || quote.status === 'SIGNED'

  return (
    <div className="min-h-screen" style={{ background: '#1E1E1E' }}>
      {/* Header */}
      <header className="border-b sticky top-0 z-10 backdrop-blur-sm" style={{ borderColor: '#2a2a2a', background: 'rgba(30,30,30,0.95)' }}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Image src="/logo.svg" alt="Freela3D" width={140} height={35} />
          <div className="text-right">
            <p className="text-xs text-[#666]">Orçamento</p>
            <p className="text-sm font-bold" style={{ color: '#D5FF40' }}>#{quote.number}</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-8">

        {/* Status banner */}
        {isSigned && (
          <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: '#D5FF40' }}>
            <span className="text-3xl">✓</span>
            <div>
              <p className="font-bold text-[#1E1E1E] text-lg">Orçamento aprovado!</p>
              <p className="text-sm text-[#1E1E1E]/70">
                Assinado por {quote.signedByName} em {quote.signedAt ? formatDate(quote.signedAt) : '—'}
              </p>
            </div>
          </div>
        )}

        {/* Title & Client */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{quote.title}</h1>
          {quote.client && (
            <p className="text-[#888]">
              Para: <strong className="text-white">{quote.client.name}</strong>
              {quote.client.company && <span className="text-[#666]"> · {quote.client.company}</span>}
            </p>
          )}
          <div className="flex items-center gap-4 mt-3 text-sm text-[#666]">
            <span>Criado em {formatDate(quote.createdAt)}</span>
            {quote.validUntil && <span>· Válido até {formatDate(quote.validUntil)}</span>}
          </div>
        </div>

        {/* Sections */}
        {quote.sections.map(sec => (
          <div key={sec.id} className="rounded-2xl border p-6" style={{ background: '#252525', borderColor: '#333' }}>
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
              <p className="text-[#888] text-sm leading-relaxed whitespace-pre-wrap">{sec.content}</p>
            )}
          </div>
        ))}

        {/* Price Table */}
        {quote.items.length > 0 && (
          <div className="rounded-2xl border overflow-hidden" style={{ background: '#252525', borderColor: '#333' }}>
            <div className="px-6 py-4 border-b" style={{ borderColor: '#333' }}>
              <h2 className="font-semibold text-white">Serviços e Valores</h2>
            </div>

            <div className="divide-y" style={{ borderColor: '#2a2a2a' }}>
              {quote.items.map(item => (
                <div key={item.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{item.name}</p>
                    {item.description && <p className="text-xs text-[#666] mt-0.5">{item.description}</p>}
                    <p className="text-xs text-[#555] mt-1">
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
            <div className="border-t divide-y" style={{ borderColor: '#333' }}>
              <div className="flex justify-between px-6 py-3 text-sm text-[#888]">
                <span>Subtotal</span><span className="text-white">{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between px-6 py-3 text-sm text-red-400">
                  <span>Desconto</span><span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between px-6 py-4 font-bold text-lg" style={{ background: '#2a2a2a' }}>
                <span className="text-white">Total</span>
                <span style={{ color: '#D5FF40' }}>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Signature Section */}
        {!isSigned && (
          <div className="rounded-2xl border p-6" style={{ background: '#252525', borderColor: '#333' }}>
            <SignaturePad token={quote.token} total={total} onSigned={() => setSigned(true)} />
          </div>
        )}

        {/* Signed signature display */}
        {isSigned && quote.signatureData && (
          <div className="rounded-2xl border p-6" style={{ background: '#252525', borderColor: '#333' }}>
            <p className="text-xs text-[#666] uppercase tracking-wide mb-4">Assinatura registrada</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={quote.signatureData} alt="Assinatura" className="max-h-24 opacity-80" />
            <p className="text-sm text-[#888] mt-2">{quote.signedByName}</p>
          </div>
        )}

      </main>

      <footer className="border-t mt-16 py-8 text-center" style={{ borderColor: '#2a2a2a' }}>
        <p className="text-xs text-[#444]">Gerado por <strong className="text-[#D5FF40]">Freela3D.pro</strong></p>
      </footer>
    </div>
  )
}
