'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export function DeleteQuoteButton({ quoteId }: { quoteId: string }) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function deleteQuote() {
    setDeleting(true)
    const res = await fetch(`/api/orcamentos/${quoteId}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Orçamento excluído')
      router.refresh()
    } else {
      toast.error('Erro ao excluir')
      setDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <>
      <button
        onClick={e => { e.stopPropagation(); setShowConfirm(true) }}
        className="text-xs text-red-500 hover:text-red-400 transition-colors ml-3"
      >
        Excluir
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-2xl border p-6 w-full max-w-sm" style={{ background: '#161518', borderColor: 'rgba(255,255,255,0.1)' }}>
            <h3 className="text-white font-semibold text-lg mb-2">Excluir orçamento?</h3>
            <p className="text-[#a8a296] text-sm mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-[rgba(255,255,255,0.16)] text-[#a8a296] hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={deleteQuote}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
