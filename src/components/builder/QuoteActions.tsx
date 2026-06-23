'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Props {
  quoteId: string
  token: string
  status: string
  portalUrl: string
}

export function QuoteActions({ quoteId, token, status, portalUrl }: Props) {
  const router = useRouter()
  const [copying, setCopying] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function copyLink() {
    setCopying(true)
    await navigator.clipboard.writeText(portalUrl)
    toast.success('Link copiado!')
    setCopying(false)
  }

  async function duplicateQuote() {
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

  async function deleteQuote() {
    setDeleting(true)
    const res = await fetch(`/api/orcamentos/${quoteId}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Orçamento excluído')
      router.push('/admin/orcamentos')
      router.refresh()
    } else {
      toast.error('Erro ao excluir')
      setDeleting(false)
      setShowConfirm(false)
    }
  }

  const STATUS_LABEL: Record<string, string> = {
    DRAFT: 'Rascunho', SENT: 'Enviado', VIEWED: 'Visualizado',
    SIGNED: 'Assinado', DECLINED: 'Recusado', PAID: 'Pago',
  }
  const STATUS_CLS: Record<string, string> = {
    DRAFT: 'text-zinc-400 bg-zinc-800',
    SENT: 'text-blue-400 bg-blue-900/30',
    VIEWED: 'text-yellow-400 bg-yellow-900/30',
    SIGNED: 'text-[#D5FF40] bg-[#D5FF40]/10',
    DECLINED: 'text-red-400 bg-red-900/30',
    PAID: 'text-green-400 bg-green-900/30',
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_CLS[status] ?? ''}`}>
          {STATUS_LABEL[status] ?? status}
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

        <button
          onClick={duplicateQuote}
          disabled={duplicating}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-medium border border-[#333] text-[#888] hover:text-white hover:border-[#555] transition-all disabled:opacity-50"
        >
          {duplicating ? 'Duplicando…' : '⧉ Duplicar'}
        </button>

        <a
          href={`${portalUrl}?print=1`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-medium border border-[#333] text-[#888] hover:text-white hover:border-[#555] transition-all"
        >
          📄 PDF
        </a>

        <button
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-medium border border-red-900/50 text-red-500 hover:bg-red-900/20 transition-all"
        >
          🗑 Excluir
        </button>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-2xl border p-6 w-full max-w-sm" style={{ background: '#252525', borderColor: '#333' }}>
            <h3 className="text-white font-semibold text-lg mb-2">Excluir orçamento?</h3>
            <p className="text-[#888] text-sm mb-6">Esta ação não pode ser desfeita. O link de acesso do cliente deixará de funcionar.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-[#444] text-[#888] hover:text-white transition-colors"
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
