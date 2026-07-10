'use client'

import { useState, useEffect, useCallback } from 'react'

type Service = {
  id: string
  name: string
  category: string
  price: number
  description: string | null
  active: boolean
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function ServicosPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', category: '', price: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/servicos')
    setServices(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function startEdit(s: Service) {
    setEditingId(s.id)
    setForm({ name: s.name, category: s.category, price: String(s.price), description: s.description ?? '' })
    setShowForm(true)
  }

  function startNew() {
    setEditingId(null)
    setForm({ name: '', category: '', price: '', description: '' })
    setShowForm(true)
  }

  async function save() {
    if (!form.name || !form.category || !form.price) return
    setSaving(true)
    const body = { name: form.name, category: form.category, price: form.price, description: form.description || null }
    if (editingId) {
      await fetch(`/api/servicos/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    } else {
      await fetch('/api/servicos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setSaving(false)
    setShowForm(false)
    load()
  }

  async function toggleActive(s: Service) {
    await fetch(`/api/servicos/${s.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !s.active }),
    })
    load()
  }

  async function remove(id: string) {
    if (!confirm('Excluir serviço?')) return
    await fetch(`/api/servicos/${id}`, { method: 'DELETE' })
    load()
  }

  const filtered = services.filter(
    s => s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase())
  )

  const categories = [...new Set(services.map(s => s.category))].sort()

  const inputCls = 'w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#e8b84b]'
  const inputStyle = { background: '#09090a', border: '1px solid rgba(255,255,255,0.1)' }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Meus Serviços</h1>
          <p className="text-[#a8a296] text-sm mt-0.5">Catálogo de serviços e preços</p>
        </div>
        <button
          onClick={startNew}
          className="px-5 py-2.5 rounded-full text-sm font-semibold text-[#09090a]"
          style={{ background: '#e8b84b' }}
        >
          + Novo Serviço
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total de serviços', value: services.length },
          { label: 'Ativos', value: services.filter(s => s.active).length },
          { label: 'Categorias', value: categories.length },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border p-5" style={{ background: '#161518', borderColor: 'rgba(255,255,255,0.1)' }}>
            <p className="text-xs text-[#6e6a60] mb-2 uppercase tracking-wide font-mono">{s.label}</p>
            <p className="text-2xl font-bold text-[#e8b84b]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          className={inputCls}
          style={inputStyle}
          placeholder="Buscar por nome ou categoria…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: '#000000aa' }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ background: '#161518', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 className="text-lg font-bold text-white">{editingId ? 'Editar' : 'Novo'} Serviço</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[#a8a296] mb-1 uppercase tracking-wide font-mono">Nome *</label>
                <input className={inputCls} style={inputStyle} placeholder="Nome do serviço" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-[#a8a296] mb-1 uppercase tracking-wide font-mono">Categoria *</label>
                <input className={inputCls} style={inputStyle} placeholder="Ex: Modelagem 3D" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} list="cats" />
                <datalist id="cats">{categories.map(c => <option key={c} value={c} />)}</datalist>
              </div>
              <div>
                <label className="block text-xs text-[#a8a296] mb-1 uppercase tracking-wide font-mono">Preço (R$) *</label>
                <input className={inputCls} style={inputStyle} placeholder="0" type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-[#a8a296] mb-1 uppercase tracking-wide font-mono">Descrição</label>
                <textarea className={inputCls} style={inputStyle} placeholder="Descrição opcional…" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm text-[#a8a296] hover:text-white transition-colors" style={{ background: '#09090a', border: '1px solid rgba(255,255,255,0.1)' }}>
                Cancelar
              </button>
              <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-full text-sm font-semibold text-[#09090a] disabled:opacity-50" style={{ background: '#e8b84b' }}>
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-[#6e6a60]">Carregando…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border" style={{ background: '#161518', borderColor: 'rgba(255,255,255,0.1)' }}>
          <p className="text-4xl mb-3">◈</p>
          <p className="text-[#6e6a60]">{search ? 'Nenhum resultado' : 'Nenhum serviço cadastrado'}</p>
          {!search && (
            <button onClick={startNew} className="mt-4 text-[#e8b84b] text-sm hover:underline">
              + Criar primeiro serviço
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(s => (
            <div key={s.id} className="rounded-2xl border p-5 space-y-3 transition-all hover:border-[rgba(255,255,255,0.16)]" style={{ background: '#161518', borderColor: s.active ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.1)' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate" style={{ opacity: s.active ? 1 : 0.5 }}>{s.name}</p>
                  <p className="text-xs text-[#6e6a60] mt-0.5">{s.category}</p>
                </div>
                <button
                  onClick={() => toggleActive(s)}
                  className="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: s.active ? '#e8b84b22' : 'rgba(255,255,255,0.1)80',
                    color: s.active ? '#e8b84b' : '#6e6a60',
                    border: `1px solid ${s.active ? '#e8b84b60' : 'rgba(255,255,255,0.1)'}`,
                  }}
                >
                  {s.active ? 'Ativo' : 'Inativo'}
                </button>
              </div>
              {s.description && <p className="text-xs text-[#6e6a60] line-clamp-2">{s.description}</p>}
              <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: '#1c1b1e' }}>
                <span className="text-lg font-bold text-[#e8b84b]">{formatBRL(s.price)}</span>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(s)} className="text-xs text-[#6e6a60] hover:text-white transition-colors px-2 py-1">Editar</button>
                  <button onClick={() => remove(s.id)} className="text-xs text-[#6e6a60] hover:text-red-400 transition-colors px-2 py-1">Excluir</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
