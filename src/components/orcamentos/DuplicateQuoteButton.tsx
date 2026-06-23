'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export function DuplicateQuoteButton({ quoteId }: { quoteId: string }) {
  const router = useRouter()
  const [duplicating, setDuplicating] = useState(false)

  async function duplicate() {
    setDuplicating(true)
    const res = await fetch(`/api/orcamentos/${quoteId}/duplicate`, { method: 'POST' })
    if (res.ok) {
      const { id } = await res.json()
      toast.success('Orçamento duplicado!')
      router.push(`/admin/orcamentos/${id}`)
    } else {
      toast.error('Erro ao duplicar')
      setDuplicating(false)
    }
  }

  return (
    <button
      onClick={e => { e.stopPropagation(); duplicate() }}
      disabled={duplicating}
      className="text-xs text-[#888] hover:text-white transition-colors ml-3 disabled:opacity-50"
    >
      {duplicating ? '…' : 'Duplicar'}
    </button>
  )
}
