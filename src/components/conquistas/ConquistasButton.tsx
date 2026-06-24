'use client'

import { useState, useEffect } from 'react'

type MonthData = { month: string; label: string; amount: number }
type ConquistasData = { total: number; monthly: MonthData[] }

const MILESTONES = [1000, 5000, 10000, 20000, 30000, 40000, 50000]
const PLAQUES = [
  { value: 100000, label: '100K', icon: '🏆' },
  { value: 250000, label: '250K', icon: '👑' },
  { value: 500000, label: '500K', icon: '👑' },
  { value: 1000000, label: '1M', icon: '✦' },
]

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function fmtShort(v: number) {
  if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}K`
  return fmt(v)
}

function ConquistasModal({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<ConquistasData | null>(null)

  useEffect(() => {
    fetch('/api/conquistas').then(r => r.json()).then(setData).catch(() => {})
  }, [])

  const total = data?.total ?? 0
  const monthly = data?.monthly ?? []
  const maxMonthly = Math.max(...monthly.map(m => m.amount), 1)

  const nextPlaque = PLAQUES.find(p => total < p.value)
  const remaining = nextPlaque ? nextPlaque.value - total : 0
  const nextPlaquePct = nextPlaque ? Math.min(100, (total / nextPlaque.value) * 100) : 100

  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div
        className="rounded-2xl border w-full flex flex-col overflow-hidden"
        style={{ background: '#1a1a1a', borderColor: '#2a2a2a', maxWidth: 480, maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#2a2a2a' }}>
          <div className="flex items-center gap-3">
            <span className="text-xl" style={{ color: '#ef4444' }}>🏆</span>
            <h2 className="font-bold text-white text-lg">Suas Conquistas</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-[#666] hover:text-white transition-colors text-xl">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">

          {/* Faturamento Total */}
          <div className="rounded-2xl p-5 text-center" style={{ background: '#251515', border: '1px solid #3a1a1a' }}>
            <p className="text-sm text-[#888] mb-1">Faturamento Total</p>
            <p className="text-3xl font-bold" style={{ color: '#ef4444' }}>
              {data ? fmt(total) : '—'}
            </p>
          </div>

          {/* Placas de Conquista */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm" style={{ color: '#888' }}>👑</span>
              <p className="text-sm font-semibold text-white">Placas de Conquista</p>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {PLAQUES.map(p => {
                const unlocked = total >= p.value
                return (
                  <div
                    key={p.value}
                    className="rounded-2xl border flex flex-col items-center justify-center py-4 gap-2"
                    style={{
                      background: unlocked ? '#251515' : '#141414',
                      borderColor: unlocked ? '#ef4444' : '#2a2a2a',
                    }}
                  >
                    <span className="text-2xl" style={{ opacity: unlocked ? 1 : 0.25 }}>{p.icon}</span>
                    {!unlocked && <span className="text-sm" style={{ opacity: 0.3 }}>🔒</span>}
                    <span className="text-xs font-bold" style={{ color: unlocked ? '#ef4444' : '#555' }}>{p.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Linha do Tempo */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm" style={{ color: '#888' }}>◎</span>
              <p className="text-sm font-semibold text-white">Linha do Tempo</p>
            </div>
            <div className="flex flex-col gap-2">
              {MILESTONES.map(m => {
                const reached = total >= m
                return (
                  <div
                    key={m}
                    className="rounded-xl border flex items-center gap-3 px-4 py-3"
                    style={{ background: '#141414', borderColor: reached ? '#2a2a2a' : '#1e1e1e' }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                      style={{
                        background: reached ? '#251515' : '#1a1a1a',
                        border: `1px solid ${reached ? '#ef4444' : '#2a2a2a'}`,
                        color: reached ? '#ef4444' : '#444',
                      }}
                    >
                      {reached ? '✓' : '○'}
                    </div>
                    <span className="flex-1 text-sm font-medium" style={{ color: reached ? '#fff' : '#555' }}>
                      {fmtShort(m).replace('R$ ', 'R$ ')}
                    </span>
                    <span className="text-xs" style={{ color: '#444' }}>{fmt(m)}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Faturamento Mensal */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm" style={{ color: '#888' }}>↗</span>
              <p className="text-sm font-semibold text-white">Faturamento Mensal</p>
            </div>
            <div className="flex flex-col gap-1.5">
              {monthly.map(m => {
                const isCurrent = m.month === currentMonthKey
                const pct = maxMonthly > 0 ? (m.amount / maxMonthly) * 100 : 0
                return (
                  <div key={m.month} className="flex items-center gap-3">
                    <span
                      className="text-xs w-12 shrink-0 text-right"
                      style={{ color: isCurrent ? '#ef4444' : '#666' }}
                    >
                      {m.label}
                    </span>
                    <div className="flex-1 rounded-full overflow-hidden" style={{ background: '#1e1e1e', height: 6 }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.max(pct, m.amount > 0 ? 2 : 0)}%`,
                          background: isCurrent ? '#ef4444' : '#333',
                        }}
                      />
                    </div>
                    <span className="text-xs w-8 text-right" style={{ color: '#555' }}>
                      {m.amount > 0 ? fmtShort(m.amount).replace('R$ ', '') : '-'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Próxima Placa */}
          {nextPlaque && (
            <div className="rounded-2xl border p-4" style={{ background: '#141414', borderColor: '#2a2a2a' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-white">Próxima Placa</span>
                <span className="text-sm font-bold" style={{ color: '#ef4444' }}>{nextPlaque.label}</span>
              </div>
              <div className="rounded-full overflow-hidden mb-2" style={{ background: '#1e1e1e', height: 6 }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${nextPlaquePct}%`, background: '#ef4444' }}
                />
              </div>
              <p className="text-xs text-center" style={{ color: '#555' }}>
                <strong style={{ color: '#888' }}>{fmt(remaining)}</strong> restantes para a próxima placa
              </p>
            </div>
          )}

          {!nextPlaque && (
            <div className="rounded-2xl border p-4 text-center" style={{ background: '#251515', borderColor: '#ef4444' }}>
              <p className="text-2xl mb-1">🏆</p>
              <p className="text-sm font-bold text-white">Parabéns! Você conquistou todas as placas!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function ConquistasButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:text-white hover:border-[#555]"
        style={{ borderColor: '#333', color: '#888' }}
      >
        🏆 Conquistas
      </button>
      {open && <ConquistasModal onClose={() => setOpen(false)} />}
    </>
  )
}
