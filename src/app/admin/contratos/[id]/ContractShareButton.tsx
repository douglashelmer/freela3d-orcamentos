'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface Props {
  shareUrl: string
  contractId: string
}

export function ContractShareButton({ shareUrl, contractId }: Props) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success('Link copiado!')
    setTimeout(() => setCopied(false), 2000)

    // Mark as SENT
    await fetch(`/api/contratos/${contractId}/send`, { method: 'POST' }).catch(() => {})
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all"
      style={{ borderColor: 'rgba(255,255,255,0.1)', color: copied ? '#e8b84b' : '#a8a296', background: copied ? '#e8b84b15' : 'transparent' }}
    >
      {copied ? '✓ Copiado' : '🔗 Compartilhar'}
    </button>
  )
}
