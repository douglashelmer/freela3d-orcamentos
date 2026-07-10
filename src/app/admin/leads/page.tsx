'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

type Lead = {
  id: string
  name: string
  email: string | null
  phone: string | null
  document: string | null
  zipCode: string | null
  address: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  project: string | null
  estimatedValue: number | null
  tags: string | null
  notes: string | null
  column: string
  createdAt: string
}

const COLUMNS = [
  { key: 'NEW', label: 'Novo Lead', color: '#a8a296' },
  { key: 'CONTACTED', label: 'Em Contato', color: '#60a5fa' },
  { key: 'PROPOSAL', label: 'Proposta Enviada', color: '#a78bfa' },
  { key: 'NEGOTIATION', label: 'Em Negociação', color: '#fbbf24' },
  { key: 'CLOSED', label: 'Fechado', color: '#e8b84b' },
  { key: 'LOST', label: 'Perdido', color: '#f87171' },
]

const EMPTY_FORM = {
  name: '', email: '', phone: '', document: '',
  zipCode: '', address: '', neighborhood: '', city: '', state: '',
  project: '', estimatedValue: '', tags: '', notes: '',
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const dragId = useRef<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/leads')
    setLeads(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditingLead(null)
    setForm({ ...EMPTY_FORM })
    setShowForm(true)
  }

  function openEdit(lead: Lead) {
    setEditingLead(lead)
    setForm({
      name: lead.name,
      email: lead.email ?? '',
      phone: lead.phone ?? '',
      document: lead.document ?? '',
      zipCode: lead.zipCode ?? '',
      address: lead.address ?? '',
      neighborhood: lead.neighborhood ?? '',
      city: lead.city ?? '',
      state: lead.state ?? '',
      project: lead.project ?? '',
      estimatedValue: lead.estimatedValue ? String(lead.estimatedValue) : '',
      tags: lead.tags ?? '',
      notes: lead.notes ?? '',
    })
    setShowForm(true)
  }

  async function lookupCep(cep: string) {
    const clean = cep.replace(/\D/g, '')
    if (clean.length !== 8) return
    setCepLoading(true)
    try {
      const res = await fetch(`/api/cep/${clean}`)
      if (res.ok) {
        const d = await res.json()
        setForm(f => ({ ...f, address: d.address || f.address, neighborhood: d.neighborhood || f.neighborhood, city: d.city || f.city, state: d.state || f.state }))
      }
    } finally { setCepLoading(false) }
  }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const body = {
      ...form,
      estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : null,
      column: editingLead?.column ?? 'NEW',
    }
    if (editingLead) {
      await fetch(`/api/leads/${editingLead.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    } else {
      await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setSaving(false)
    setShowForm(false)
    load()
  }

  async function deleteLead(id: string) {
    if (!confirm('Excluir lead?')) return
    await fetch(`/api/leads/${id}`, { method: 'DELETE' })
    load()
  }

  async function moveToColumn(leadId: string, column: string) {
    await fetch(`/api/leads/${leadId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ column }) })
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, column } : l))
  }

  const byColumn = (col: string) => leads.filter(l => l.column === col)
  const totalValue = leads.filter(l => l.column !== 'LOST').reduce((s, l) => s + (l.estimatedValue ?? 0), 0)

  const inputCls = 'w-full px-3 py-2 rounded-lg text-sm text-white outline-none focus:ring-2 focus:ring-[#e8b84b]'
  const inputStyle = { background: '#09090a', border: '1px solid rgba(255,255,255,0.1)' }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b shrink-0" style={{ borderColor: '#1c1b1e' }}>
        <div>
          <h1 className="text-2xl font-bold text-white">Pipeline de Leads</h1>
          <p className="text-[#a8a296] text-sm mt-0.5">
            {leads.length} leads · {formatBRL(totalValue)} em oportunidades
          </p>
        </div>
        <button onClick={openNew} className="px-5 py-2.5 rounded-full text-sm font-semibold text-[#09090a]" style={{ background: '#e8b84b' }}>
          + Novo Lead
        </button>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto p-6">
        {loading ? (
          <div className="text-center py-16 text-[#6e6a60]">Carregando…</div>
        ) : (
          <div className="flex gap-4 h-full min-h-0" style={{ minWidth: `${COLUMNS.length * 280}px` }}>
            {COLUMNS.map(col => {
              const colLeads = byColumn(col.key)
              const colValue = colLeads.reduce((s, l) => s + (l.estimatedValue ?? 0), 0)
              const isOver = dragOver === col.key
              return (
                <div
                  key={col.key}
                  className="flex flex-col rounded-2xl transition-all"
                  style={{
                    width: 272,
                    minWidth: 272,
                    background: isOver ? '#1c1b1e' : '#1f1f1f',
                    border: `1px solid ${isOver ? col.color + '60' : '#1c1b1e'}`,
                  }}
                  onDragOver={e => { e.preventDefault(); setDragOver(col.key) }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={e => {
                    e.preventDefault()
                    setDragOver(null)
                    if (dragId.current) moveToColumn(dragId.current, col.key)
                  }}
                >
                  {/* Column header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: '#1c1b1e' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: col.color }} />
                      <span className="text-sm font-medium text-white">{col.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {colLeads.length > 0 && (
                        <span className="text-xs text-[#6e6a60]">{formatBRL(colValue)}</span>
                      )}
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#1c1b1e', color: '#a8a296' }}>
                        {colLeads.length}
                      </span>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {colLeads.map(lead => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={() => { dragId.current = lead.id }}
                        onDragEnd={() => { dragId.current = null; setDragOver(null) }}
                        className="rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-[rgba(255,255,255,0.16)] transition-all"
                        style={{ background: '#161518', border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-medium text-white leading-tight">{lead.name}</p>
                          <button
                            onClick={() => openEdit(lead)}
                            className="text-[#6e6a60] hover:text-white transition-colors shrink-0 text-xs px-1"
                          >
                            ✎
                          </button>
                        </div>
                        {lead.project && (
                          <p className="text-xs text-[#6e6a60] mb-1.5 truncate">{lead.project}</p>
                        )}
                        {lead.estimatedValue ? (
                          <p className="text-sm font-bold" style={{ color: col.color }}>{formatBRL(lead.estimatedValue)}</p>
                        ) : null}
                        {lead.tags && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {lead.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                              <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', color: '#a8a296' }}>{tag}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2 pt-2 border-t" style={{ borderColor: '#1c1b1e' }}>
                          {lead.phone && <span className="text-xs text-[#6e6a60] truncate">{lead.phone}</span>}
                          <button onClick={() => deleteLead(lead.id)} className="ml-auto text-xs text-[rgba(255,255,255,0.16)] hover:text-red-400 transition-colors">✕</button>
                        </div>
                      </div>
                    ))}
                    {colLeads.length === 0 && (
                      <div className="text-center py-8 text-[rgba(255,255,255,0.16)] text-xs">Arraste leads aqui</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: '#000000cc' }}>
          <div className="w-full max-w-xl rounded-2xl overflow-y-auto max-h-[90vh]" style={{ background: '#161518', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <h3 className="text-lg font-bold text-white">{editingLead ? 'Editar Lead' : 'Novo Lead'}</h3>
              <button onClick={() => setShowForm(false)} className="text-[#6e6a60] hover:text-white transition-colors text-xl leading-none">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {/* Grid fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-[#a8a296] mb-1 uppercase tracking-wide font-mono">Nome *</label>
                  <input className={inputCls} style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do lead" />
                </div>
                <div>
                  <label className="block text-xs text-[#a8a296] mb-1 uppercase tracking-wide font-mono">Email</label>
                  <input className={inputCls} style={inputStyle} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" />
                </div>
                <div>
                  <label className="block text-xs text-[#a8a296] mb-1 uppercase tracking-wide font-mono">Telefone</label>
                  <input className={inputCls} style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(00) 00000-0000" />
                </div>
                <div>
                  <label className="block text-xs text-[#a8a296] mb-1 uppercase tracking-wide font-mono">CPF / CNPJ</label>
                  <input className={inputCls} style={inputStyle} value={form.document} onChange={e => setForm(f => ({ ...f, document: e.target.value }))} placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="block text-xs text-[#a8a296] mb-1 uppercase tracking-wide font-mono">Valor Estimado (R$)</label>
                  <input className={inputCls} style={inputStyle} type="number" min="0" value={form.estimatedValue} onChange={e => setForm(f => ({ ...f, estimatedValue: e.target.value }))} placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs text-[#a8a296] mb-1 uppercase tracking-wide font-mono">Projeto / Interesse</label>
                  <input className={inputCls} style={inputStyle} value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))} placeholder="Ex: Modelagem 3D produto" />
                </div>
                <div>
                  <label className="block text-xs text-[#a8a296] mb-1 uppercase tracking-wide font-mono">Tags</label>
                  <input className={inputCls} style={inputStyle} value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="Urgente, Recorrente" />
                </div>
              </div>

              {/* Endereço */}
              <div className="rounded-xl p-4 space-y-3" style={{ background: '#09090a', border: '1px solid #1c1b1e' }}>
                <p className="text-xs text-[#6e6a60] uppercase tracking-wide font-mono font-medium">Endereço</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#a8a296] mb-1">CEP</label>
                    <div className="flex gap-1.5 items-center">
                      <input className={inputCls} style={inputStyle} value={form.zipCode} onChange={e => setForm(f => ({ ...f, zipCode: e.target.value }))} onBlur={e => lookupCep(e.target.value)} placeholder="00000-000" maxLength={9} />
                      {cepLoading && <span className="text-xs text-[#6e6a60]">…</span>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-[#a8a296] mb-1">Bairro</label>
                    <input className={inputCls} style={inputStyle} value={form.neighborhood} onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-[#a8a296] mb-1">Endereço</label>
                    <input className={inputCls} style={inputStyle} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Rua, Av…" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#a8a296] mb-1">Cidade</label>
                    <input className={inputCls} style={inputStyle} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-[#a8a296] mb-1">Estado</label>
                    <input className={inputCls} style={inputStyle} value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} maxLength={2} />
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs text-[#a8a296] mb-1 uppercase tracking-wide font-mono">Observações</label>
                <textarea className={inputCls} style={inputStyle} rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notas sobre o lead…" />
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              {editingLead && (
                <button onClick={() => { setShowForm(false); deleteLead(editingLead.id) }} className="px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-400/10 transition-colors">
                  Excluir
                </button>
              )}
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm text-[#a8a296] hover:text-white transition-colors" style={{ background: '#09090a', border: '1px solid rgba(255,255,255,0.1)' }}>
                Cancelar
              </button>
              <button onClick={save} disabled={saving || !form.name.trim()} className="flex-1 py-2.5 rounded-full text-sm font-semibold text-[#09090a] disabled:opacity-40" style={{ background: '#e8b84b' }}>
                {saving ? 'Salvando…' : editingLead ? 'Salvar' : 'Criar Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
