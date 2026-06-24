import { auth } from '@/auth'
import { db } from '@/lib/db'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { DeleteQuoteButton } from '@/components/orcamentos/DeleteQuoteButton'
import { DuplicateQuoteButton } from '@/components/orcamentos/DuplicateQuoteButton'

export default async function OrcamentosPage() {
  const session = await auth()
  const quotes = await db.quote.findMany({
    where: { userId: session!.user!.id! },
    include: { client: true, items: true },
    orderBy: { createdAt: 'desc' },
  })

  const statusLabel: Record<string, string> = {
    DRAFT: 'Rascunho', SENT: 'Enviado', VIEWED: 'Visualizado',
    SIGNED: 'Assinado', DECLINED: 'Recusado', PAID: 'Pago',
  }
  const statusColor: Record<string, string> = {
    DRAFT: 'text-zinc-400 bg-zinc-800',
    SENT: 'text-blue-400 bg-blue-900/30',
    VIEWED: 'text-yellow-400 bg-yellow-900/30',
    SIGNED: 'text-[#D5FF40] bg-[#D5FF40]/10',
    DECLINED: 'text-red-400 bg-red-900/30',
    PAID: 'text-green-400 bg-green-900/30',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Orçamentos</h1>
          <p className="text-[#888] text-sm mt-0.5">{quotes.length} orçamento{quotes.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orcamentos/pdf"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-[#333] text-[#888] hover:text-white hover:border-[#555] transition-all"
          >
            🎨 Personalizar PDF
          </Link>
          <Link
            href="/admin/orcamentos/novo"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#1E1E1E]"
            style={{ background: '#D5FF40' }}
          >
            + Novo Orçamento
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: '#252525', borderColor: '#333' }}>
        {quotes.length === 0 ? (
          <div className="py-16 text-center text-[#555]">
            <p className="text-5xl mb-4">◻</p>
            <p className="text-lg mb-1">Nenhum orçamento criado</p>
            <p className="text-sm mb-4">Comece criando seu primeiro orçamento</p>
            <Link href="/admin/orcamentos/novo"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#1E1E1E]"
              style={{ background: '#D5FF40' }}
            >
              Criar Orçamento
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: '#333' }}>
                {['#', 'Título', 'Cliente', 'Valor', 'Status', 'Data', ''].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-[#666] px-6 py-3 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#2a2a2a' }}>
              {quotes.map(q => {
                const total = q.items.reduce((s, i) => s + i.price * i.quantity, 0)
                return (
                  <tr key={q.id} className="hover:bg-[#2a2a2a] transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-[#D5FF40]">#{q.number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-white">{q.title}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#888]">
                      {q.client?.name ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {formatCurrency(total)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[q.status]}`}>
                        {statusLabel[q.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#666]">
                      {formatDate(q.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Link href={`/admin/orcamentos/${q.id}`}
                          className="text-xs text-[#D5FF40] hover:underline"
                        >
                          Abrir
                        </Link>
                        <DuplicateQuoteButton quoteId={q.id} />
                        <DeleteQuoteButton quoteId={q.id} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
