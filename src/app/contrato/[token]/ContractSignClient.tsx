'use client'

import { useRef, useEffect, useState } from 'react'
import SignaturePadLib from 'signature_pad'

interface Props {
  token: string
  contract: {
    clientName: string
    projectName: string
    generatedContent: string
    finalValue: number
    status: string
    signedAt: string | null
    signedByName: string | null
  }
}

export function ContractSignClient({ contract, token }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const padRef = useRef<SignaturePadLib | null>(null)
  const [name, setName] = useState('')
  const [isEmpty, setIsEmpty] = useState(true)
  const [signing, setSigning] = useState(false)
  const [done, setDone] = useState(contract.status === 'SIGNED')

  useEffect(() => {
    if (!canvasRef.current || done) return
    const pad = new SignaturePadLib(canvasRef.current, {
      penColor: '#09090a',
      backgroundColor: 'rgba(0,0,0,0)',
    })
    pad.addEventListener('endStroke', () => setIsEmpty(pad.isEmpty()))
    padRef.current = pad

    const resize = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ratio = window.devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      canvas.getContext('2d')?.scale(ratio, ratio)
      pad.clear()
      setIsEmpty(true)
    }
    window.addEventListener('resize', resize)
    resize()
    return () => window.removeEventListener('resize', resize)
  }, [done])

  function clearPad() {
    padRef.current?.clear()
    setIsEmpty(true)
  }

  async function sign() {
    if (!name.trim() || isEmpty || !padRef.current) return
    setSigning(true)
    try {
      const clientSignature = padRef.current.toDataURL()
      const res = await fetch(`/api/contratos/assinar/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedByName: name.trim(), clientSignature }),
      })
      if (res.ok) setDone(true)
    } finally {
      setSigning(false)
    }
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="min-h-screen" style={{ background: '#f5f5f5' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between border-b" style={{ background: '#09090a', borderColor: '#1c1b1e' }}>
        <div>
          <p className="text-xs text-[#a8a296]">Contrato de Prestação de Serviços</p>
          <p className="text-white font-semibold text-sm">{contract.projectName}</p>
        </div>
        <div className="flex items-center gap-3">
          {contract.finalValue > 0 && (
            <span className="text-sm font-bold" style={{ color: '#e8b84b' }}>{fmt(contract.finalValue)}</span>
          )}
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[#6e6a60] hover:text-white transition-colors text-lg leading-none"
            title="Fechar"
          >
            ✕
          </button>
        </div>
      </header>

      {/* Contract text */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div
          className="bg-white rounded-2xl p-8 md:p-12 shadow-sm mb-8"
          style={{ fontFamily: 'Georgia, serif', lineHeight: '1.8', color: '#0f0f11' }}
          dangerouslySetInnerHTML={{
            __html: contract.generatedContent
              .replace(/\n/g, '<br/>')
              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'),
          }}
        />

        {/* Signature section */}
        {done ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4" style={{ background: '#e8b84b20' }}>
              ✅
            </div>
            <h2 className="text-xl font-bold text-[#09090a] mb-2">Contrato assinado!</h2>
            <p className="text-[#6e6a60] text-sm">
              Assinado por <strong>{contract.signedByName ?? name}</strong>
              {contract.signedAt && (
                <> em {new Date(contract.signedAt).toLocaleDateString('pt-BR')}</>
              )}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-lg font-bold text-[#09090a] mb-6">Assinar contrato</h2>

            <label className="block mb-4">
              <span className="text-sm font-medium text-[rgba(255,255,255,0.16)] mb-1.5 block">Seu nome completo</span>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={contract.clientName}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#09090a]"
                style={{ border: '1.5px solid #e5e7eb', background: '#fafafa' }}
              />
            </label>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-[rgba(255,255,255,0.16)]">Assinatura</span>
                <button onClick={clearPad} className="text-xs text-[#a8a296] hover:text-[rgba(255,255,255,0.16)]">Limpar</button>
              </div>
              <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #e5e7eb', background: '#fafafa' }}>
                <canvas
                  ref={canvasRef}
                  className="w-full touch-none"
                  style={{ height: 140, display: 'block' }}
                />
              </div>
              {isEmpty && (
                <p className="text-xs text-[#a8a296] mt-1.5 text-center">Assine com o dedo ou mouse acima</p>
              )}
            </div>

            <button
              onClick={sign}
              disabled={signing || !name.trim() || isEmpty}
              className="w-full py-4 rounded-xl font-bold text-sm transition-opacity disabled:opacity-40"
              style={{ background: '#09090a', color: '#e8b84b' }}
            >
              {signing ? 'Assinando…' : 'Assinar contrato'}
            </button>

            <p className="text-xs text-[#a8a296] text-center mt-4">
              Ao assinar, você concorda com todos os termos descritos neste contrato.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
