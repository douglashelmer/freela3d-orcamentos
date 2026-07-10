'use client'

import { useRef, useEffect, useState } from 'react'
import SignaturePadLib from 'signature_pad'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'

interface Props {
  token: string
  total: number
  onSigned: () => void
}

export function SignaturePad({ token, total, onSigned }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const padRef = useRef<SignaturePadLib | null>(null)
  const [name, setName] = useState('')
  const [doc, setDoc] = useState('')
  const [signing, setSigning] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    if (!canvasRef.current) return
    const pad = new SignaturePadLib(canvasRef.current, {
      backgroundColor: 'rgb(30, 30, 30)',
      penColor: '#e8b84b',
    })
    padRef.current = pad
    pad.addEventListener('endStroke', () => setIsEmpty(pad.isEmpty()))

    function resize() {
      const canvas = canvasRef.current!
      const ratio = window.devicePixelRatio || 1
      const data = pad.toData()
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      canvas.getContext('2d')!.scale(ratio, ratio)
      pad.fromData(data)
    }
    window.addEventListener('resize', resize)
    resize()
    return () => { pad.off(); window.removeEventListener('resize', resize) }
  }, [])

  function clear() {
    padRef.current?.clear()
    setIsEmpty(true)
  }

  async function sign() {
    if (!name.trim()) { toast.error('Digite seu nome completo'); return }
    if (isEmpty || !padRef.current) { toast.error('Assine no campo acima'); return }
    setSigning(true)
    try {
      const signatureData = padRef.current.toDataURL('image/png')
      const res = await fetch(`/api/assinar/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureData, signedByName: name, signedByDoc: doc }),
      })
      if (!res.ok) throw new Error()
      toast.success('Orçamento assinado com sucesso!')
      onSigned()
    } catch {
      toast.error('Erro ao assinar. Tente novamente.')
    } finally {
      setSigning(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium text-[#a8a296] mb-3 uppercase tracking-wide font-mono">Assinatura Digital</p>
        <p className="text-sm text-[#6e6a60] mb-4">
          Ao assinar, você concorda com os termos e valores apresentados neste orçamento.
          Valor total: <strong className="text-[#e8b84b]">{formatCurrency(total)}</strong>
        </p>
      </div>

      {/* Canvas */}
      <div className="rounded-2xl border-2 border-dashed border-[rgba(255,255,255,0.1)] overflow-hidden" style={{ height: 200 }}>
        <canvas
          ref={canvasRef}
          className="sig-canvas w-full h-full"
          style={{ background: '#09090a' }}
        />
      </div>

      <button
        onClick={clear}
        className="self-start text-xs text-[#6e6a60] hover:text-[#a8a296] transition-colors"
      >
        Limpar assinatura
      </button>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[#6e6a60] mb-1.5 block">Nome completo *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Seu nome"
            className="w-full h-11 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#161518] px-4 text-white text-sm placeholder-[rgba(255,255,255,0.16)] focus:outline-none focus:border-[#e8b84b] transition-colors"
          />
        </div>
        <div>
          <label className="text-xs text-[#6e6a60] mb-1.5 block">CPF / CNPJ</label>
          <input
            value={doc}
            onChange={e => setDoc(e.target.value)}
            placeholder="000.000.000-00"
            className="w-full h-11 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#161518] px-4 text-white text-sm placeholder-[rgba(255,255,255,0.16)] focus:outline-none focus:border-[#e8b84b] transition-colors"
          />
        </div>
      </div>

      <button
        onClick={sign}
        disabled={signing || isEmpty || !name.trim()}
        className="w-full h-14 rounded-full text-base font-bold text-[#09090a] transition-all disabled:opacity-40"
        style={{ background: '#e8b84b' }}
      >
        {signing ? 'Assinando...' : '✓ Assinar e Aprovar Orçamento'}
      </button>
    </div>
  )
}
