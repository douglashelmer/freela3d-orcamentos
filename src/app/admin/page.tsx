import { auth } from '@/auth'
import { db } from '@/lib/db'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { ConquistasButton } from '@/components/conquistas/ConquistasButton'

async function getStats(userId: string) {
  const [total, signed, sent, declined, quotes, user] = await Promise.all([
    db.quote.count({ where: { userId } }),
    db.quote.count({ where: { userId, status: 'SIGNED' } }),
    db.quote.count({ where: { userId, status: { in: ['SENT', 'VIEWED'] } } }),
    db.quote.count({ where: { userId, status: 'DECLINED' } }),
    db.quote.findMany({
      where: { userId },
      include: { client: true, items: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    db.user.findUnique({ where: { id: userId }, select: { monthlyGoal: true, name: true, company: true } }),
  ])
  const revenue = quotes
    .filter(q => q.status === 'SIGNED' || q.status === 'PAID')
    .reduce((sum, q) => sum + q.items.reduce((s, i) => s + i.price * i.quantity, 0), 0)
  return { total, signed, sent, declined, revenue, recent: quotes, monthlyGoal: user?.monthlyGoal ?? null }
}

export default async function AdminDashboard() {
  const session = await auth()
  const { total, signed, sent, declined, revenue, recent, monthlyGoal } = await getStats(session!.user!.id!)
  const goalPct = monthlyGoal && monthlyGoal > 0 ? Math.min(100, Math.round((revenue / monthlyGoal) * 100)) : null

  const stats = [
    { label: 'Total', value: total, color: 'text-white' },
    { label: 'Aguardando', value: sent, color: 'text-yellow-400' },
    { label: 'Assinados', value: signed, color: 'text-[#e8b84b]' },
    { label: 'Recusados', value: declined, color: 'text-red-400' },
    { label: 'Receita Aprovada', value: formatCurrency(revenue), color: 'text-[#e8b84b]' },
  ]

  const statusLabel: Record<string, string> = {
    DRAFT: 'Rascunho', SENT: 'Enviado', VIEWED: 'Visualizado',
    SIGNED: 'Assinado', DECLINED: 'Recusado', PAID: 'Pago',
  }
  const statusColor: Record<string, string> = {
    DRAFT: 'text-zinc-400', SENT: 'text-blue-400', VIEWED: 'text-yellow-400',
    SIGNED: 'text-[#e8b84b]', DECLINED: 'text-red-400', PAID: 'text-green-400',
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-start justify-between mb-6 md:mb-8 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-[#a8a296] text-sm mt-0.5">Bem-vindo, {session?.user?.name?.split(' ')[0]}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ConquistasButton />
          <Link
            href="/admin/orcamentos/novo"
            className="flex items-center gap-1.5 px-3 md:px-5 py-2.5 rounded-full text-sm font-semibold text-[#09090a] transition-colors"
            style={{ background: '#e8b84b' }}
          >
            + <span className="hidden sm:inline">Novo </span>Orçamento
          </Link>
        </div>
      </div>

      {/* Meta de receita */}
      {monthlyGoal && (
        <div className="gold-glow rounded-2xl border p-4 md:p-5 mb-4 md:mb-6" style={{ background: '#161518', borderColor: 'rgba(232,184,75,0.25)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-[#6e6a60] uppercase tracking-wide font-mono">Meta do mês</p>
              <p className="text-white font-semibold mt-0.5">
                {formatCurrency(revenue)} <span className="text-[#6e6a60] font-normal">/ {formatCurrency(monthlyGoal)}</span>
              </p>
            </div>
            <p className="text-2xl font-bold text-[#e8b84b]">{goalPct}%</p>
          </div>
          <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-2 rounded-full transition-all" style={{ background: '#e8b84b', width: `${goalPct}%` }} />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl border p-4 md:p-5" style={{ background: '#161518', borderColor: 'rgba(255,255,255,0.1)' }}>
            <p className="text-xs text-[#6e6a60] mb-1.5 md:mb-2 uppercase tracking-wide font-mono">{s.label}</p>
            <p className={`text-xl md:text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Quotes */}
      <div className="rounded-2xl border" style={{ background: '#161518', borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <h2 className="font-semibold text-white">Orçamentos Recentes</h2>
          <Link href="/admin/orcamentos" className="text-xs text-[#e8b84b] hover:underline">Ver todos</Link>
        </div>
        <div className="divide-y" style={{ borderColor: '#1c1b1e' }}>
          {recent.length === 0 && (
            <div className="py-12 text-center text-[#6e6a60]">
              <p className="text-4xl mb-3">◻</p>
              <p>Nenhum orçamento ainda</p>
              <Link href="/admin/orcamentos/novo" className="text-[#e8b84b] text-sm hover:underline mt-2 inline-block">
                Criar primeiro orçamento
              </Link>
            </div>
          )}
          {recent.map(q => (
            <Link key={q.id} href={`/admin/orcamentos/${q.id}`}
              className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 hover:bg-[#1c1b1e] transition-colors gap-3"
            >
              <div className="flex items-center gap-3 md:gap-4 min-w-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-[#09090a] shrink-0" style={{ background: '#e8b84b' }}>
                  {q.number}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{q.title}</p>
                  <p className="text-xs text-[#6e6a60] truncate">{q.client?.name ?? 'Sem cliente'}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-6 shrink-0">
                <p className="text-sm font-medium text-white">
                  {formatCurrency(q.items.reduce((s, i) => s + i.price * i.quantity, 0))}
                </p>
                <span className={`text-xs font-medium ${statusColor[q.status]}`}>
                  {statusLabel[q.status]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
