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
      penColor: '#D5FF40',
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
        <p className="text-sm font-medium text-[#888] mb-3 uppercase tracking-wide">Assinatura Digital</p>
        <p className="text-sm text-[#666] mb-4">
          Ao assinar, você concorda com os termos e valores apresentados neste orçamento.
          Valor total: <strong className="text-[#D5FF40]">{formatCurrency(total)}</strong>
        </p>
      </div>

      {/* Canvas */}
      <div className="rounded-2xl border-2 border-dashed border-[#333] overflow-hidden" style={{ height: 200 }}>
        <canvas
          ref={canvasRef}
          className="sig-canvas w-full h-full"
          style={{ background: '#1E1E1E' }}
        />
      </div>

      <button
        onClick={clear}
        className="self-start text-xs text-[#555] hover:text-[#888] transition-colors"
      >
        Limpar assinatura
      </button>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[#666] mb-1.5 block">Nome completo *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Seu nome"
            className="w-full h-11 rounded-xl border border-[#333] bg-[#252525] px-4 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#D5FF40] transition-colors"
          />
        </div>
        <div>
          <label className="text-xs text-[#666] mb-1.5 block">CPF / CNPJ</label>
          <input
            value={doc}
            onChange={e => setDoc(e.target.value)}
            placeholder="000.000.000-00"
            className="w-full h-11 rounded-xl border border-[#333] bg-[#252525] px-4 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#D5FF40] transition-colors"
          />
        </div>
      </div>

      <button
        onClick={sign}
        disabled={signing || isEmpty || !name.trim()}
        className="w-full h-14 rounded-2xl text-base font-bold text-[#1E1E1E] transition-all disabled:opacity-40"
        style={{ background: '#D5FF40' }}
      >
        {signing ? 'Assinando...' : '✓ Assinar e Aprovar Orçamento'}
      </button>
    </div>
  )
}
