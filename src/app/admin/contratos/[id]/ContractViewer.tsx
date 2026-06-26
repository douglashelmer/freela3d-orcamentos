'use client'

import { useEffect } from 'react'

interface Props {
  contract: {
    id: string
    clientName: string
    projectName: string
    generatedContent: string
    totalValue: number
    finalValue: number
    paymentMethod: string
    paymentConditions: string
    installments: number
    createdAt: string
    token?: string | null
    status?: string
    signedAt?: string | null
    signedByName?: string | null
  }
}

const printCSS = `
  @media print {
    .no-print { display: none !important; }
    body { background: #fff !important; }
    .contract-paper {
      box-shadow: none !important;
      margin: 0 !important;
      padding: 40px !important;
      max-width: 100% !important;
    }
  }
`

export function ContractViewer({ contract }: Props) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('print') === '1') {
      setTimeout(() => window.print(), 600)
    }
  }, [])

  const lines = contract.generatedContent.split('\n')

  return (
    <>
      <style>{printCSS}</style>

      <div className="py-12 px-6 flex justify-center">
        <div
          className="contract-paper w-full rounded-2xl p-12"
          style={{
            background: '#fff',
            color: '#1a1a1a',
            maxWidth: 800,
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: 14,
            lineHeight: 1.8,
          }}
        >
          {/* Print button inside paper (shows on screen) */}
          <div className="no-print flex justify-end mb-6">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all"
              style={{ borderColor: '#ddd', color: '#666', background: '#f9f9f9' }}
            >
              📄 Imprimir / Salvar PDF
            </button>
          </div>

          {/* Contract content */}
          <div style={{ color: '#1a1a1a' }}>
            {lines.map((line, i) => {
              const trimmed = line.trim()

              // Big title (first line)
              if (i === 0 && trimmed) {
                return (
                  <h1 key={i} style={{ textAlign: 'center', fontSize: 16, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 }}>
                    {trimmed}
                  </h1>
                )
              }

              // Section headers (numbered like "01 –", "02 –", etc.)
              if (/^\d+[\s–—-]/.test(trimmed) && trimmed.length < 80) {
                return (
                  <p key={i} style={{ fontWeight: 'bold', marginTop: 20, marginBottom: 4 }}>
                    {trimmed}
                  </p>
                )
              }

              // Sub-clauses (1.1., 2.1., etc.)
              if (/^\d+\.\d+\./.test(trimmed)) {
                return (
                  <p key={i} style={{ marginBottom: 6, textAlign: 'justify' }}>
                    {trimmed}
                  </p>
                )
              }

              // Signature lines
              if (trimmed.startsWith('___')) {
                return (
                  <p key={i} style={{ marginTop: 32, marginBottom: 2 }}>
                    {trimmed}
                  </p>
                )
              }

              // Empty line
              if (!trimmed) {
                return <div key={i} style={{ height: 8 }} />
              }

              // Regular paragraph
              return (
                <p key={i} style={{ marginBottom: 4, textAlign: 'justify' }}>
                  {trimmed}
                </p>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
