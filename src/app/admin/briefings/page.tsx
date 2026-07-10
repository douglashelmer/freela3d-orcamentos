'use client'

import { useState, useEffect } from 'react'

type Briefing = {
  id: string
  token: string
  type: string
  clientName: string
  clientEmail: string
  status: string
  projectType: string | null
  description: string | null
  references: string | null
  deadline: string | null
  budget: string | null
  answeredAt: string | null
  createdAt: string
}

const TYPES = [
  { key: 'LOGO', label: 'Logo', desc: 'Criação de logotipo e marca' },
  { key: 'LANDING_PAGE', label: 'Landing Page', desc: 'Página de conversão/vendas' },
  { key: 'SOCIAL_MEDIA', label: 'Social Media / Criativos', desc: 'Posts, stories e anúncios' },
  { key: 'BRANDING', label: 'Branding / Identidade Visual', desc: 'Identidade visual completa' },
  { key: 'VIDEO', label: 'Vídeo / Motion', desc: 'Vídeos e animações' },
  { key: 'OTHER', label: 'Outro', desc: 'Outro tipo de projeto' },
]

const TYPE_LABELS: Record<string, string> = Object.fromEntries(TYPES.map(t => [t.key, t.label]))

export default function BriefingsPage() {
  const [briefings, setBriefings] = useState<Briefing[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'type' | 'client' | null>(null)
  const [selectedType, setSelectedType] = useState('')
  const [form, setForm] = useState({ clientName: '', clientEmail: '' })
  const [creating, setCreating] = useState(false)
  const [viewId, setViewId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterType, setFilterType] = useState('ALL')
  const [copied, setCopied] = useState<string | null>(null)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  async function load() {
    const res = await fetch('/api/briefings')
    setBriefings(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function create() {
    setCreating(true)
    await fetch('/api/briefings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: selectedType, clientName: form.clientName, clientEmail: form.clientEmail }),
    })
    setModal(null)
    setForm({ clientName: '', clientEmail: '' })
    setSelectedType('')
    setCreating(false)
    load()
  }

  async function deleteBriefing(id: string) {
    await fetch(`/api/briefings/${id}`, { method: 'DELETE' })
    load()
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(`${baseUrl}/b/${token}`)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  const filtered = briefings.filter(b => {
    if (search && !b.clientName.toLowerCase().includes(search.toLowerCase()) && !b.clientEmail.toLowerCase().includes(search.toLowerCase())) return false
    if (filterStatus !== 'ALL' && b.status !== filterStatus) return false
    if (filterType !== 'ALL' && b.type !== filterType) return false
    return true
  })

  const total = briefings.length
  const pending = briefings.filter(b => b.status === 'PENDING').length
  const responded = briefings.filter(b => b.status === 'RESPONDED').length
  const types = new Set(briefings.map(b => b.type)).size

  const viewed = viewId ? briefings.find(b => b.id === viewId) : null

  const inputCls = 'w-full px-4 py-3 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#e8b84b]'
  const inputStyle = { background: '#161518', border: '1px solid rgba(255,255,255,0.1)' }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b shrink-0" style={{ borderColor: '#1c1b1e' }}>
        <div>
          <h1 className="text-2xl font-bold text-white">Briefings</h1>
          <p className="text-[#a8a296] text-sm mt-0.5">Gerencie os briefings dos seus clientes</p>
        </div>
        <button
          onClick={() => setModal('type')}
          className="px-4 py-2 rounded-full text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: '#e8b84b', color: '#09090a' }}
        >
          + Novo Briefing
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 px-8 py-4 border-b shrink-0" style={{ borderColor: '#1c1b1e' }}>
        {[
          { label: 'Total', value: total, icon: '◻' },
          { label: 'Pendentes', value: pending, icon: '◷', color: '#f59e0b' },
          { label: 'Respondidos', value: responded, icon: '✓', color: '#34d399' },
          { label: 'Tipos', value: types, icon: '◈', color: '#a78bfa' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: '#161518', border: '1px solid #1c1b1e' }}>
            <div className="flex items-center gap-2 mb-1">
              <span style={{ color: s.color ?? '#6e6a60' }}>{s.icon}</span>
              <span className="text-xs text-[#6e6a60]">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 px-8 py-3 border-b shrink-0" style={{ borderColor: '#1c1b1e' }}>
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6e6a60]">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-white outline-none"
            style={{ background: '#161518', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-xl text-sm text-[#a8a296] outline-none" style={{ background: '#161518', border: '1px solid rgba(255,255,255,0.1)' }}>
          <option value="ALL">Todos os status</option>
          <option value="PENDING">Pendentes</option>
          <option value="RESPONDED">Respondidos</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 rounded-xl text-sm text-[#a8a296] outline-none" style={{ background: '#161518', border: '1px solid rgba(255,255,255,0.1)' }}>
          <option value="ALL">Todos os tipos</option>
          {TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-8 py-4">
        {loading ? (
          <div className="text-[#6e6a60] text-sm">Carregando…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <span className="text-5xl text-[rgba(255,255,255,0.1)]">◻</span>
            <p className="text-white font-medium">Nenhum briefing encontrado</p>
            <p className="text-[#6e6a60] text-sm">Crie seu primeiro briefing para enviar aos clientes</p>
            <button onClick={() => setModal('type')} className="px-4 py-2 rounded-full text-sm font-semibold" style={{ background: '#e8b84b', color: '#09090a' }}>
              + Criar Briefing
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(b => (
              <div key={b.id} className="flex items-center gap-4 px-5 py-4 rounded-xl group hover:border-[rgba(255,255,255,0.1)] transition-all" style={{ background: '#161518', border: '1px solid #1c1b1e' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-white truncate">{b.clientName}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: b.status === 'RESPONDED' ? '#34d39922' : '#f59e0b22', color: b.status === 'RESPONDED' ? '#34d399' : '#f59e0b' }}>
                      {b.status === 'RESPONDED' ? 'Respondido' : 'Pendente'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full text-[#a8a296]" style={{ background: '#09090a' }}>
                      {TYPE_LABELS[b.type] ?? b.type}
                    </span>
                  </div>
                  <p className="text-xs text-[#6e6a60]">{b.clientEmail}</p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {b.status === 'RESPONDED' && (
                    <button onClick={() => setViewId(b.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#e8b84b] hover:bg-[#e8b84b]/10 transition-colors">
                      Ver respostas
                    </button>
                  )}
                  <button onClick={() => copyLink(b.token)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#a8a296] hover:text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors">
                    {copied === b.token ? '✓ Copiado' : '🔗 Copiar link'}
                  </button>
                  <button onClick={() => deleteBriefing(b.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#6e6a60] hover:text-red-400 hover:bg-red-400/10 transition-colors">
                    Excluir
                  </button>
                </div>
                <p className="text-xs text-[rgba(255,255,255,0.16)] shrink-0">{new Date(b.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Select Type */}
      {modal === 'type' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: '#0f0f11', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Selecione o Tipo de Briefing</h2>
              <button onClick={() => setModal(null)} className="text-[#6e6a60] hover:text-white text-xl">×</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {TYPES.map(t => (
                <button
                  key={t.key}
                  onClick={() => setSelectedType(t.key)}
                  className="text-left p-4 rounded-xl transition-all"
                  style={{
                    background: selectedType === t.key ? '#e8b84b15' : '#161518',
                    border: `1px solid ${selectedType === t.key ? '#e8b84b' : 'rgba(255,255,255,0.1)'}`,
                  }}
                >
                  <p className="text-sm font-semibold text-white">{t.label}</p>
                  <p className="text-xs text-[#6e6a60] mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => selectedType && setModal('client')}
                disabled={!selectedType}
                className="px-5 py-2.5 rounded-full text-sm font-semibold disabled:opacity-40"
                style={{ background: '#e8b84b', color: '#09090a' }}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Client Info */}
      {modal === 'client' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#0f0f11', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Informações do Cliente</h2>
              <button onClick={() => setModal(null)} className="text-[#6e6a60] hover:text-white text-xl">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[#a8a296] mb-1.5 uppercase tracking-wide font-mono">Nome do Cliente *</label>
                <input className={inputCls} style={inputStyle} value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} placeholder="Nome completo do cliente" />
              </div>
              <div>
                <label className="block text-xs text-[#a8a296] mb-1.5 uppercase tracking-wide font-mono">E-mail do Cliente *</label>
                <input className={inputCls} style={inputStyle} type="email" value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))} placeholder="email@cliente.com" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-6">
              <button onClick={() => setModal('type')} className="text-sm text-[#6e6a60] hover:text-white">← Voltar</button>
              <button
                onClick={create}
                disabled={!form.clientName || !form.clientEmail || creating}
                className="px-5 py-2.5 rounded-full text-sm font-semibold disabled:opacity-40"
                style={{ background: '#e8b84b', color: '#09090a' }}
              >
                {creating ? 'Criando…' : 'Criar Briefing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Responses */}
      {viewed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6 max-h-[80vh] overflow-y-auto" style={{ background: '#0f0f11', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">Respostas do Briefing</h2>
                <p className="text-xs text-[#6e6a60]">{viewed.clientName} · {TYPE_LABELS[viewed.type]}</p>
              </div>
              <button onClick={() => setViewId(null)} className="text-[#6e6a60] hover:text-white text-xl">×</button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Tipo de projeto', value: viewed.projectType },
                { label: 'Descrição detalhada', value: viewed.description },
                { label: 'Referências visuais', value: viewed.references },
                { label: 'Prazo esperado', value: viewed.deadline },
                { label: 'Orçamento disponível', value: viewed.budget },
              ].map(r => r.value && (
                <div key={r.label} className="rounded-xl p-4" style={{ background: '#161518', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <p className="text-xs text-[#a8a296] uppercase tracking-wide font-mono mb-1">{r.label}</p>
                  <p className="text-sm text-white whitespace-pre-wrap">{r.value}</p>
                </div>
              ))}
            </div>
            {viewed.answeredAt && (
              <p className="text-xs text-[rgba(255,255,255,0.16)] mt-4 text-center">
                Respondido em {new Date(viewed.answeredAt).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
