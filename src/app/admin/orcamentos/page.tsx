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
    SIGNED: 'text-[#e8b84b] bg-[#e8b84b]/10',
    DECLINED: 'text-red-400 bg-red-900/30',
    PAID: 'text-green-400 bg-green-900/30',
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-start justify-between mb-6 md:mb-8 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Orçamentos</h1>
          <p className="text-[#a8a296] text-sm mt-0.5">{quotes.length} orçamento{quotes.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href="/admin/orcamentos/portal"
            className="hidden sm:flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border border-[rgba(255,255,255,0.1)] text-[#a8a296] hover:text-white hover:border-[#6e6a60] transition-all"
          >
            🌐 <span className="hidden md:inline">Personalizar </span>Página
          </Link>
          <Link
            href="/admin/orcamentos/pdf"
            className="hidden sm:flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border border-[rgba(255,255,255,0.1)] text-[#a8a296] hover:text-white hover:border-[#6e6a60] transition-all"
          >
            🎨 <span className="hidden md:inline">Personalizar </span>PDF
          </Link>
          <Link
            href="/admin/orcamentos/novo"
            className="flex items-center gap-1.5 px-3 md:px-5 py-2.5 rounded-full text-sm font-semibold text-[#09090a]"
            style={{ background: '#e8b84b' }}
          >
            + <span className="hidden sm:inline">Novo </span>Orçamento
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: '#161518', borderColor: 'rgba(255,255,255,0.1)' }}>
        {quotes.length === 0 ? (
          <div className="py-16 text-center text-[#6e6a60]">
            <p className="text-5xl mb-4">◻</p>
            <p className="text-lg mb-1">Nenhum orçamento criado</p>
            <p className="text-sm mb-4">Comece criando seu primeiro orçamento</p>
            <Link href="/admin/orcamentos/novo"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-[#09090a]"
              style={{ background: '#e8b84b' }}
            >
              Criar Orçamento
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="divide-y md:hidden" style={{ borderColor: '#1c1b1e' }}>
              {quotes.map(q => {
                const total = q.items.reduce((s, i) => s + i.price * i.quantity, 0)
                return (
                  <Link key={q.id} href={`/admin/orcamentos/${q.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#1c1b1e] transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-[#09090a] shrink-0" style={{ background: '#e8b84b' }}>
                      {q.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{q.title}</p>
                      <p className="text-xs text-[#6e6a60] truncate">{q.client?.name ?? 'Sem cliente'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-white">{formatCurrency(total)}</p>
                      <span className={`text-xs font-medium ${statusColor[q.status]}`}>{statusLabel[q.status]}</span>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Desktop: table */}
            <table className="hidden md:table w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  {['#', 'Título', 'Cliente', 'Valor', 'Status', 'Data', ''].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-[#6e6a60] px-6 py-3 uppercase tracking-wide font-mono">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#1c1b1e' }}>
                {quotes.map(q => {
                  const total = q.items.reduce((s, i) => s + i.price * i.quantity, 0)
                  return (
                    <tr key={q.id} className="hover:bg-[#1c1b1e] transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-[#e8b84b]">#{q.number}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-white">{q.title}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#a8a296]">
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
                      <td className="px-6 py-4 text-sm text-[#6e6a60]">
                        {formatDate(q.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Link href={`/admin/orcamentos/${q.id}`}
                            className="text-xs text-[#e8b84b] hover:underline"
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
          </>
        )}
      </div>
    </div>
  )
}
