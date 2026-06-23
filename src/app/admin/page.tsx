import { auth } from '@/auth'
import { db } from '@/lib/db'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

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
    { label: 'Assinados', value: signed, color: 'text-[#D5FF40]' },
    { label: 'Recusados', value: declined, color: 'text-red-400' },
    { label: 'Receita Aprovada', value: formatCurrency(revenue), color: 'text-[#D5FF40]' },
  ]

  const statusLabel: Record<string, string> = {
    DRAFT: 'Rascunho', SENT: 'Enviado', VIEWED: 'Visualizado',
    SIGNED: 'Assinado', DECLINED: 'Recusado', PAID: 'Pago',
  }
  const statusColor: Record<string, string> = {
    DRAFT: 'text-zinc-400', SENT: 'text-blue-400', VIEWED: 'text-yellow-400',
    SIGNED: 'text-[#D5FF40]', DECLINED: 'text-red-400', PAID: 'text-green-400',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-[#888] text-sm mt-0.5">Bem-vindo de volta, {session?.user?.name?.split(' ')[0]}</p>
        </div>
        <Link
          href="/admin/orcamentos/novo"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#1E1E1E] transition-colors"
          style={{ background: '#D5FF40' }}
        >
          + Novo Orçamento
        </Link>
      </div>

      {/* Meta de receita */}
      {monthlyGoal && (
        <div className="rounded-2xl border p-5 mb-6" style={{ background: '#252525', borderColor: '#333' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-[#666] uppercase tracking-wide">Meta do mês</p>
              <p className="text-white font-semibold mt-0.5">
                {formatCurrency(revenue)} <span className="text-[#666] font-normal">/ {formatCurrency(monthlyGoal)}</span>
              </p>
            </div>
            <p className="text-2xl font-bold text-[#D5FF40]">{goalPct}%</p>
          </div>
          <div className="h-2 rounded-full" style={{ background: '#333' }}>
            <div className="h-2 rounded-full transition-all" style={{ background: '#D5FF40', width: `${goalPct}%` }} />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl border p-5" style={{ background: '#252525', borderColor: '#333' }}>
            <p className="text-xs text-[#666] mb-2 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Quotes */}
      <div className="rounded-2xl border" style={{ background: '#252525', borderColor: '#333' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#333' }}>
          <h2 className="font-semibold text-white">Orçamentos Recentes</h2>
          <Link href="/admin/orcamentos" className="text-xs text-[#D5FF40] hover:underline">Ver todos</Link>
        </div>
        <div className="divide-y" style={{ borderColor: '#2a2a2a' }}>
          {recent.length === 0 && (
            <div className="py-12 text-center text-[#555]">
              <p className="text-4xl mb-3">◻</p>
              <p>Nenhum orçamento ainda</p>
              <Link href="/admin/orcamentos/novo" className="text-[#D5FF40] text-sm hover:underline mt-2 inline-block">
                Criar primeiro orçamento
              </Link>
            </div>
          )}
          {recent.map(q => (
            <Link key={q.id} href={`/admin/orcamentos/${q.id}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-[#2a2a2a] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-[#1E1E1E]" style={{ background: '#D5FF40' }}>
                  {q.number}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{q.title}</p>
                  <p className="text-xs text-[#666]">{q.client?.name ?? 'Sem cliente'}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
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
