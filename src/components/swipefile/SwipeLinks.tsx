'use client'

import { useState } from 'react'

export type SwipeLinkData = {
  id: string
  url: string
  title: string | null
  note: string | null
  createdAt: string
}

function domainOf(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

export function SwipeLinks({ folderId, initialLinks }: { folderId: string; initialLinks: SwipeLinkData[] }) {
  const [links, setLinks] = useState<SwipeLinkData[]>(initialLinks)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!url.trim()) return
    setSaving(true)
    const res = await fetch(`/api/swipefile/${folderId}/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, title }),
    })
    if (res.ok) {
      const link = await res.json()
      setLinks(ls => [link, ...ls])
      setUrl('')
      setTitle('')
    }
    setSaving(false)
  }

  async function remove(id: string) {
    setLinks(ls => ls.filter(l => l.id !== id))
    await fetch(`/api/swipefile/${folderId}/links/${id}`, { method: 'DELETE' })
  }

  const inputCls = 'px-4 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#D5FF40]'
  const inputStyle = { background: '#252525', border: '1px solid #333' }

  return (
    <div className="flex flex-col h-full">
      {/* Add link form */}
      <div className="flex items-center gap-2 px-6 py-4 border-b shrink-0" style={{ borderColor: '#2a2a2a' }}>
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()}
          placeholder="Cole um link (ex: instagram.com/ads/...)"
          className={`flex-1 ${inputCls}`}
          style={inputStyle}
        />
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()}
          placeholder="Título (opcional)"
          className={`w-56 ${inputCls}`}
          style={inputStyle}
        />
        <button
          onClick={save}
          disabled={!url.trim() || saving}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 shrink-0"
          style={{ background: '#D5FF40', color: '#1E1E1E' }}
        >
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {links.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <span className="text-4xl text-[#333]">🔗</span>
            <p className="text-[#666] text-sm">Nenhum link salvo ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {links.map(l => (
              <div key={l.id} className="flex items-center gap-4 px-5 py-3.5 rounded-xl group" style={{ background: '#252525', border: '1px solid #2a2a2a' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#1E1E1E' }}>
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${domainOf(l.url)}&sz=32`}
                    alt=""
                    className="w-4 h-4"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{l.title || domainOf(l.url)}</p>
                  <p className="text-xs text-[#666] truncate">{l.url}</p>
                </a>
                <p className="text-xs text-[#444] shrink-0">{new Date(l.createdAt).toLocaleDateString('pt-BR')}</p>
                <button
                  onClick={() => remove(l.id)}
                  className="px-2 py-1 rounded-lg text-xs text-[#666] opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-400/10 transition-all shrink-0"
                >
                  Excluir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
