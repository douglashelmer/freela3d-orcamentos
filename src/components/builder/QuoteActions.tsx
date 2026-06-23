'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface Props {
  quoteId: string
  token: string
  status: string
  portalUrl: string
}

export function QuoteActions({ quoteId, token, status, portalUrl }: Props) {
  const [copying, setCopying] = useState(false)

  async function copyLink() {
    setCopying(true)
    await navigator.clipboard.writeText(portalUrl)
    toast.success('Link copiado!')
    setCopying(false)
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs px-2.5 py-1 rounded-full font-medium
        ${status === 'DRAFT' ? 'text-zinc-400 bg-zinc-800' : ''}
        ${status === 'SENT' ? 'text-blue-400 bg-blue-900/30' : ''}
        ${status === 'VIEWED' ? 'text-yellow-400 bg-yellow-900/30' : ''}
        ${status === 'SIGNED' ? 'text-[#D5FF40] bg-[#D5FF40]/10' : ''}
        ${status === 'DECLINED' ? 'text-red-400 bg-red-900/30' : ''}
        ${status === 'PAID' ? 'text-green-400 bg-green-900/30' : ''}
      `}>
        {status === 'DRAFT' && 'Rascunho'}
        {status === 'SENT' && 'Enviado'}
        {status === 'VIEWED' && 'Visualizado'}
        {status === 'SIGNED' && 'Assinado'}
        {status === 'DECLINED' && 'Recusado'}
        {status === 'PAID' && 'Pago'}
      </span>

      <button
        onClick={copyLink}
        disabled={copying}
        className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-medium border border-[#333] text-[#888] hover:text-white hover:border-[#555] transition-all"
      >
        {copying ? 'Copiado!' : '🔗 Copiar link'}
      </button>

      <a
        href={portalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-medium border border-[#333] text-[#888] hover:text-white hover:border-[#555] transition-all"
      >
        👁 Visualizar
      </a>
    </div>
  )
}
