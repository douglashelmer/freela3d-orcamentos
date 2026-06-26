'use client'

import { useState, useEffect, useCallback } from 'react'

type Transaction = {
  id: string
  type: string
  description: string
  amount: number
  dueDate: string
  paidAt: string | null
  status: string
  category: string | null
  notes: string | null
  createdAt: string
}

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

const EMPTY_FORM = { type: 'EXPENSE', description: '', amount: '', dueDate: '', status: 'PENDING', category: '', notes: '' }

const CATEGORIES = ['Software / Assinaturas', 'Marketing', 'Equipamentos', 'Impostos', 'Freelancers', 'Infraestrutura', 'Outros']

export default function FinanceiroPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/transacoes?year=${year}&month=${month}`)
    setTransactions(await res.json())
    setLoading(false)
  }, [year, month])

  useEffect(() => { load() }, [load])

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  function openNew(type: 'INCOME' | 'EXPENSE') {
    setEditingId(null)
    const today = new Date().toISOString().split('T')[0]
    setForm({ ...EMPTY_FORM, type, dueDate: today })
    setShowForm(true)
  }

  function openEdit(tx: Transaction) {
    setEditingId(tx.id)
    setForm({
      type: tx.type,
      description: tx.description,
      amount: String(tx.amount),
      dueDate: tx.dueDate.split('T')[0],
      status: tx.status,
      category: tx.category ?? '',
      notes: tx.notes ?? '',
    })
    setShowForm(true)
  }

  async function save() {
    if (!form.description || !form.amount || !form.dueDate) return
    setSaving(true)
    const body = { ...form, amount: Number(form.amount) }
    if (editingId) {
      await fetch(`/api/transacoes/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    } else {
      await fetch('/api/transacoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setSaving(false)
    setShowForm(false)
    load()
  }

  async function remove(id: string) {
    if (!confirm('Excluir lançamento?')) return
    await fetch(`/api/transacoes/${id}`, { method: 'DELETE' })
    load()
  }

  async function markPaid(tx: Transaction) {
    const status = tx.status === 'PAID' ? 'PENDING' : 'PAID'
    const paidAt = status === 'PAID' ? new Date().toISOString() : null
    await fetch(`/api/transacoes/${tx.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, paidAt }) })
    load()
  }

  const incomes = transactions.filter(t => t.type === 'INCOME')
  const expenses = transactions.filter(t => t.type === 'EXPENSE')
  const today = new Date(); today.setHours(0, 0, 0, 0)

  const totalIncome = incomes.reduce((s, t) => s + t.amount, 0)
  const receivedIncome = incomes.filter(t => t.status === 'PAID').reduce((s, t) => s + t.amount, 0)
  const pendingIncome = incomes.filter(t => t.status !== 'PAID').reduce((s, t) => s + t.amount, 0)
  const overdueIncome = incomes.filter(t => t.status === 'PENDING' && new Date(t.dueDate) < today).reduce((s, t) => s + t.amount, 0)

  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0)
  const paidExpense = expenses.filter(t => t.status === 'PAID').reduce((s, t) => s + t.amount, 0)
  const pendingExpense = expenses.filter(t => t.status !== 'PAID').reduce((s, t) => s + t.amount, 0)
  const overdueExpense = expenses.filter(t => t.status === 'PENDING' && new Date(t.dueDate) < today).reduce((s, t) => s + t.amount, 0)

  const profit = receivedIncome - paidExpense

  const overdueIncomes = incomes.filter(t => t.status === 'PENDING' && new Date(t.dueDate) < today)
  const overdueExpenses = expenses.filter(t => t.status === 'PENDING' && new Date(t.dueDate) < today)

  const inputCls = 'w-full px-3 py-2 rounded-lg text-sm text-white outline-none focus:ring-2 focus:ring-[#D5FF40]'
  const inputStyle = { background: '#1E1E1E', border: '1px solid #333' }

  const statusLabel: Record<string, string> = { PENDING: 'Pendente', PAID: 'Pago', PARTIAL: 'Parcial' }
  const statusColor: Record<string, string> = { PENDING: 'text-yellow-400', PAID: 'text-[#D5FF40]', PARTIAL: 'text-blue-400' }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-5 md:mb-6 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Financeiro</h1>
          <p className="text-[#888] text-sm mt-0.5">Receitas e despesas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openNew('INCOME')} className="px-3 md:px-4 py-2.5 rounded-xl text-sm font-semibold text-[#1E1E1E]" style={{ background: '#D5FF40' }}>
            + Receita
          </button>
          <button onClick={() => openNew('EXPENSE')} className="px-3 md:px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: '#333' }}>
            + Despesa
          </button>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={prevMonth} className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:bg-[#333] transition-colors" style={{ background: '#252525', border: '1px solid #333' }}>‹</button>
        <span className="text-white font-medium min-w-[160px] text-center">{MONTHS[month - 1]} de {year}</span>
        <button onClick={nextMonth} className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:bg-[#333] transition-colors" style={{ background: '#252525', border: '1px solid #333' }}>›</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-5 md:mb-6">
        <div className="rounded-2xl border p-5 space-y-3" style={{ background: '#252525', borderColor: '#333' }}>
          <p className="text-xs text-[#666] uppercase tracking-wide font-medium">Contas a Receber</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-[#888]">Faturamento</span>
              <span className="text-white font-medium">{formatBRL(totalIncome)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#888]">Pendente</span>
              <span className="text-yellow-400">{formatBRL(pendingIncome)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#888]">Vencido</span>
              <span className="text-red-400">{formatBRL(overdueIncome)}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-1.5" style={{ borderColor: '#333' }}>
              <span className="text-[#888]">Recebido</span>
              <span className="font-bold text-[#D5FF40]">{formatBRL(receivedIncome)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border p-5 space-y-3" style={{ background: '#252525', borderColor: '#333' }}>
          <p className="text-xs text-[#666] uppercase tracking-wide font-medium">Contas a Pagar</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-[#888]">Total de Despesas</span>
              <span className="text-white font-medium">{formatBRL(totalExpense)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#888]">Pendente</span>
              <span className="text-yellow-400">{formatBRL(pendingExpense)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#888]">Vencido</span>
              <span className="text-red-400">{formatBRL(overdueExpense)}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-1.5" style={{ borderColor: '#333' }}>
              <span className="text-[#888]">Pago</span>
              <span className="font-bold text-red-400">-{formatBRL(paidExpense)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border p-5 space-y-3" style={{ background: '#252525', borderColor: '#333' }}>
          <p className="text-xs text-[#666] uppercase tracking-wide font-medium">Lucro do Período</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-[#888]">Receitas</span>
              <span className="text-[#D5FF40]">{formatBRL(receivedIncome)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#888]">Despesas</span>
              <span className="text-red-400">-{formatBRL(paidExpense)}</span>
            </div>
            <div className="flex justify-between border-t pt-1.5" style={{ borderColor: '#333' }}>
              <span className="text-sm text-[#888]">Lucro Líquido</span>
              <span className={`text-xl font-bold ${profit >= 0 ? 'text-[#D5FF40]' : 'text-red-400'}`}>{formatBRL(profit)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue alerts */}
      {(overdueIncomes.length > 0 || overdueExpenses.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-5 md:mb-6">
          {overdueIncomes.length > 0 && (
            <div className="rounded-xl p-4 border" style={{ background: '#1a1200', borderColor: '#fbbf2440' }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-yellow-400 text-sm">⚠</span>
                <p className="text-sm font-medium text-yellow-400">Recebimentos Vencidos ({overdueIncomes.length})</p>
              </div>
              <p className="text-xs text-[#888]">{formatBRL(overdueIncome)} em aberto</p>
            </div>
          )}
          {overdueExpenses.length > 0 && (
            <div className="rounded-xl p-4 border" style={{ background: '#1a0000', borderColor: '#f8717140' }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-red-400 text-sm">⚠</span>
                <p className="text-sm font-medium text-red-400">Pagamentos Vencidos ({overdueExpenses.length})</p>
              </div>
              <p className="text-xs text-[#888]">{formatBRL(overdueExpense)} em aberto</p>
            </div>
          )}
        </div>
      )}

      {/* Transactions table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: '#252525', borderColor: '#333' }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: '#333' }}>
          <h2 className="font-semibold text-white">Transações — {MONTHS[month - 1]}</h2>
        </div>
        {loading ? (
          <div className="py-12 text-center text-[#555]">Carregando…</div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-[#555]">
            <p className="text-3xl mb-3">◐</p>
            <p>Nenhuma transação neste mês</p>
            <div className="flex justify-center gap-3 mt-4">
              <button onClick={() => openNew('INCOME')} className="text-[#D5FF40] text-sm hover:underline">+ Receita</button>
              <button onClick={() => openNew('EXPENSE')} className="text-[#888] text-sm hover:underline">+ Despesa</button>
            </div>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#2a2a2a' }}>
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between px-4 md:px-6 py-3 hover:bg-[#2a2a2a] transition-colors group gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                    style={{ background: tx.type === 'INCOME' ? '#D5FF4020' : '#f8717120' }}>
                    {tx.type === 'INCOME' ? '↑' : '↓'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{tx.description}</p>
                    <p className="text-xs text-[#555] truncate">{tx.category || 'Sem categoria'} · {formatDate(tx.dueDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-6 shrink-0">
                  <span className={`hidden sm:inline text-xs font-medium ${statusColor[tx.status] ?? 'text-[#666]'}`}>{statusLabel[tx.status] ?? tx.status}</span>
                  <span className={`text-sm font-bold text-right ${tx.type === 'INCOME' ? 'text-[#D5FF40]' : 'text-red-400'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}{formatBRL(tx.amount)}
                  </span>
                  <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => markPaid(tx)}
                      title={tx.status === 'PAID' ? 'Marcar pendente' : 'Marcar pago'}
                      className="text-xs px-2 py-1 rounded text-[#888] hover:text-white transition-colors"
                      style={{ background: '#1E1E1E' }}
                    >
                      {tx.status === 'PAID' ? '↺' : '✓'}
                    </button>
                    <button onClick={() => openEdit(tx)} className="text-xs px-2 py-1 rounded text-[#888] hover:text-white transition-colors" style={{ background: '#1E1E1E' }}>✎</button>
                    <button onClick={() => remove(tx.id)} className="text-xs px-2 py-1 rounded text-[#666] hover:text-red-400 transition-colors" style={{ background: '#1E1E1E' }}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: '#000000cc' }}>
          <div className="w-full max-w-md rounded-2xl" style={{ background: '#252525', border: '1px solid #333' }}>
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#333' }}>
              <h3 className="text-lg font-bold text-white">
                {editingId ? 'Editar Lançamento' : form.type === 'INCOME' ? 'Nova Receita' : 'Nova Despesa'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-[#555] hover:text-white transition-colors text-xl leading-none">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                {(['INCOME', 'EXPENSE'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setForm(f => ({ ...f, type: t }))}
                    className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: form.type === t ? (t === 'INCOME' ? '#D5FF4020' : '#f8717120') : '#1E1E1E',
                      border: `1px solid ${form.type === t ? (t === 'INCOME' ? '#D5FF4060' : '#f8717160') : '#333'}`,
                      color: form.type === t ? (t === 'INCOME' ? '#D5FF40' : '#f87171') : '#888',
                    }}
                  >
                    {t === 'INCOME' ? '↑ Receita' : '↓ Despesa'}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-xs text-[#888] mb-1 uppercase tracking-wide">Descrição *</label>
                <input
                  className={inputCls}
                  style={inputStyle}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder={form.type === 'INCOME' ? 'Ex: Projeto Logo Cliente X' : 'Ex: Adobe Creative Cloud'}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#888] mb-1 uppercase tracking-wide">Valor (R$) *</label>
                  <input className={inputCls} style={inputStyle} type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0,00" />
                </div>
                <div>
                  <label className="block text-xs text-[#888] mb-1 uppercase tracking-wide">Vencimento *</label>
                  <input className={inputCls} style={inputStyle} type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#888] mb-1 uppercase tracking-wide">Categoria</label>
                  <input className={inputCls} style={inputStyle} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Categoria" list="cats-modal" />
                  <datalist id="cats-modal">{CATEGORIES.map(c => <option key={c} value={c} />)}</datalist>
                </div>
                <div>
                  <label className="block text-xs text-[#888] mb-1 uppercase tracking-wide">Status</label>
                  <select className={inputCls} style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="PENDING">Pendente</option>
                    <option value="PAID">Pago</option>
                    <option value="PARTIAL">Parcial</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#888] mb-1 uppercase tracking-wide">Observações</label>
                <textarea className={inputCls} style={inputStyle} rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Opcional…" />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm text-[#888] hover:text-white transition-colors" style={{ background: '#1E1E1E', border: '1px solid #333' }}>
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving || !form.description || !form.amount || !form.dueDate}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-[#1E1E1E] disabled:opacity-40"
                style={{ background: '#D5FF40' }}
              >
                {saving ? 'Salvando…' : 'Lançar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
