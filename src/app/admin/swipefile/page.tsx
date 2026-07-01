'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Folder = {
  id: string
  name: string
  color: string | null
  createdAt: string
  _count: { cards: number; links: number }
}

const COLORS = ['#D5FF40', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa', '#34d399']

export default function SwipeFilePage() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<Folder | null>(null)

  async function load() {
    const res = await fetch('/api/swipefile')
    setFolders(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function create() {
    if (!name.trim()) return
    setCreating(true)
    await fetch('/api/swipefile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color }),
    })
    setModal(false)
    setName('')
    setColor(COLORS[0])
    setCreating(false)
    load()
  }

  function askRemove(folder: Folder, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setConfirmDelete(folder)
  }

  async function confirmRemove() {
    if (!confirmDelete) return
    await fetch(`/api/swipefile/${confirmDelete.id}`, { method: 'DELETE' })
    setConfirmDelete(null)
    load()
  }

  const filtered = folders.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))

  const inputCls = 'w-full px-4 py-3 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#D5FF40]'
  const inputStyle = { background: '#252525', border: '1px solid #333' }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b shrink-0" style={{ borderColor: '#2a2a2a' }}>
        <div>
          <h1 className="text-2xl font-bold text-white">Swipe File</h1>
          <p className="text-[#888] text-sm mt-0.5">Organize referências, prints e links de inspiração por pasta</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: '#D5FF40', color: '#1E1E1E' }}
        >
          + Nova Pasta
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 px-8 py-3 border-b shrink-0" style={{ borderColor: '#2a2a2a' }}>
        <div className="flex-1 relative max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar pasta..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-white outline-none"
            style={{ background: '#252525', border: '1px solid #333' }}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {loading ? (
          <div className="text-[#555] text-sm">Carregando…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <span className="text-5xl text-[#333]">⌗</span>
            <p className="text-white font-medium">Nenhuma pasta ainda</p>
            <p className="text-[#666] text-sm">Crie uma pasta para guardar referências e links</p>
            <button onClick={() => setModal(true)} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: '#D5FF40', color: '#1E1E1E' }}>
              + Criar Pasta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(f => (
              <Link
                key={f.id}
                href={`/admin/swipefile/${f.id}`}
                className="group relative flex flex-col gap-3 p-5 rounded-2xl transition-all hover:border-[#444]"
                style={{ background: '#252525', border: '1px solid #2a2a2a' }}
              >
                <button
                  onClick={e => askRemove(f, e)}
                  className="absolute top-3 right-3 w-6 h-6 rounded-lg flex items-center justify-center text-xs text-[#666] opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  title="Excluir pasta"
                >
                  ×
                </button>
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: `${f.color ?? '#D5FF40'}22`, color: f.color ?? '#D5FF40' }}
                >
                  📁
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{f.name}</p>
                  <p className="text-xs text-[#666] mt-0.5">{f._count.cards} no canvas · {f._count.links} links</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Modal: New Folder */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Nova Pasta</h2>
              <button onClick={() => setModal(false)} className="text-[#666] hover:text-white text-xl">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[#888] mb-1.5 uppercase tracking-wide">Nome da Pasta *</label>
                <input
                  className={inputCls}
                  style={inputStyle}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Anúncios concorrentes"
                  onKeyDown={e => e.key === 'Enter' && create()}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-[#888] mb-1.5 uppercase tracking-wide">Cor</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className="w-8 h-8 rounded-full transition-transform"
                      style={{ background: c, transform: color === c ? 'scale(1.15)' : 'scale(1)', boxShadow: color === c ? `0 0 0 2px #1a1a1a, 0 0 0 4px ${c}` : 'none' }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={create}
                disabled={!name.trim() || creating}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
                style={{ background: '#D5FF40', color: '#1E1E1E' }}
              >
                {creating ? 'Criando…' : 'Criar Pasta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <h2 className="text-lg font-bold text-white mb-2">Excluir pasta?</h2>
            <p className="text-sm text-[#888] mb-6">
              &ldquo;{confirmDelete.name}&rdquo; e todo o conteúdo dela (canvas e links) serão excluídos permanentemente.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-[#888] hover:text-white transition-colors">
                Cancelar
              </button>
              <button onClick={confirmRemove} className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ background: '#ef4444' }}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
