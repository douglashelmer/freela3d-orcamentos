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
      style={{ borderColor: '#333', color: copied ? '#D5FF40' : '#888', background: copied ? '#D5FF4015' : 'transparent' }}
    >
      {copied ? '✓ Copiado' : '🔗 Compartilhar'}
    </button>
  )
}
