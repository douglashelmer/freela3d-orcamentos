'use client'

import { useRef, useState, useCallback } from 'react'

export type SwipeCardData = {
  id: string
  type: 'NOTE' | 'IMAGE'
  content: string
  color: string | null
  x: number
  y: number
  w: number
  h: number
  zIndex: number
}

const NOTE_COLORS = ['#D5FF40', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa']

export function SwipeCanvas({ folderId, initialCards }: { folderId: string; initialCards: SwipeCardData[] }) {
  const [cards, setCards] = useState<SwipeCardData[]>(initialCards)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const maxZ = useRef(Math.max(0, ...initialCards.map(c => c.zIndex)))

  const patchCard = useCallback(async (id: string, data: Record<string, unknown>) => {
    await fetch(`/api/swipefile/${folderId}/cards/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  }, [folderId])

  function bringToFront(id: string) {
    maxZ.current += 1
    const z = maxZ.current
    setCards(cs => cs.map(c => c.id === id ? { ...c, zIndex: z } : c))
    patchCard(id, { zIndex: z })
  }

  async function addNote() {
    const res = await fetch(`/api/swipefile/${folderId}/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'NOTE',
        content: '',
        color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
        x: 40 + Math.random() * 80,
        y: 40 + Math.random() * 80,
        w: 220, h: 160,
      }),
    })
    const card = await res.json()
    setCards(cs => [...cs, card])
  }

  async function addImageFromUrl(url: string) {
    const res = await fetch(`/api/swipefile/${folderId}/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'IMAGE', content: url, x: 60 + Math.random() * 80, y: 60 + Math.random() * 80, w: 260, h: 200 }),
    })
    const card = await res.json()
    setCards(cs => [...cs, card])
  }

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!list.length) return
    setUploading(true)
    const form = new FormData()
    list.forEach(f => form.append('files', f))
    form.append('webp', '1')
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const { urls } = await res.json()
      for (const url of urls ?? []) await addImageFromUrl(url)
    } finally {
      setUploading(false)
    }
  }

  function onPaste(e: React.ClipboardEvent) {
    const files = Array.from(e.clipboardData.items)
      .filter(i => i.type.startsWith('image/'))
      .map(i => i.getAsFile())
      .filter(Boolean) as File[]
    if (files.length) uploadFiles(files)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files)
  }

  async function updateContent(id: string, content: string) {
    setCards(cs => cs.map(c => c.id === id ? { ...c, content } : c))
    patchCard(id, { content })
  }

  async function removeCard(id: string) {
    setCards(cs => cs.filter(c => c.id !== id))
    await fetch(`/api/swipefile/${folderId}/cards/${id}`, { method: 'DELETE' })
  }

  function startDrag(e: React.PointerEvent, id: string) {
    e.preventDefault()
    bringToFront(id)
    const card = cards.find(c => c.id === id)
    if (!card) return
    const startX = e.clientX
    const startY = e.clientY
    const origX = card.x
    const origY = card.y

    function onMove(ev: PointerEvent) {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      setCards(cs => cs.map(c => c.id === id ? { ...c, x: Math.max(0, origX + dx), y: Math.max(0, origY + dy) } : c))
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      setCards(cs => {
        const c = cs.find(c => c.id === id)
        if (c) patchCard(id, { x: c.x, y: c.y })
        return cs
      })
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  function startResize(e: React.PointerEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    const card = cards.find(c => c.id === id)
    if (!card) return
    const startX = e.clientX
    const startY = e.clientY
    const origW = card.w
    const origH = card.h

    function onMove(ev: PointerEvent) {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      setCards(cs => cs.map(c => c.id === id ? { ...c, w: Math.max(120, origW + dx), h: Math.max(90, origH + dy) } : c))
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      setCards(cs => {
        const c = cs.find(c => c.id === id)
        if (c) patchCard(id, { w: c.w, h: c.h })
        return cs
      })
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-6 py-3 border-b shrink-0" style={{ borderColor: '#2a2a2a' }}>
        <button
          onClick={addNote}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
          style={{ background: '#D5FF40', color: '#1E1E1E' }}
        >
          + Nota
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
          style={{ background: '#333' }}
        >
          {uploading ? 'Enviando…' : '+ Imagem'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={e => e.target.files && uploadFiles(e.target.files)}
        />
        <span className="text-xs text-[#555] ml-2">Cole (Ctrl+V) ou arraste imagens para o quadro</span>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-auto"
        style={{
          background: '#181818',
          backgroundImage: 'radial-gradient(#2a2a2a 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
        onPaste={onPaste}
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        tabIndex={0}
      >
        <div className="relative" style={{ width: 2000, height: 1400 }}>
          {cards.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-[#444] text-sm">Quadro vazio — adicione notas ou imagens de referência</p>
            </div>
          )}
          {cards.map(card => (
            <div
              key={card.id}
              className="absolute rounded-xl shadow-lg group"
              style={{
                left: card.x, top: card.y, width: card.w, height: card.h, zIndex: card.zIndex,
                background: card.type === 'NOTE' ? (card.color ?? '#D5FF40') : '#252525',
                border: card.type === 'IMAGE' ? '1px solid #333' : 'none',
              }}
              onPointerDown={() => bringToFront(card.id)}
            >
              {/* Drag handle */}
              <div
                className="absolute top-0 left-0 right-0 h-6 cursor-move flex items-center justify-end px-1.5"
                onPointerDown={e => startDrag(e, card.id)}
              >
                <button
                  onPointerDown={e => e.stopPropagation()}
                  onClick={() => removeCard(card.id)}
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(0,0,0,0.25)', color: card.type === 'NOTE' ? '#1E1E1E' : '#fff' }}
                >
                  ×
                </button>
              </div>

              {card.type === 'NOTE' ? (
                <textarea
                  value={card.content}
                  onChange={e => updateContent(card.id, e.target.value)}
                  placeholder="Escreva aqui…"
                  className="w-full h-full bg-transparent resize-none outline-none px-3 pt-6 pb-3 text-sm font-medium"
                  style={{ color: '#1E1E1E' }}
                  onPointerDown={e => e.stopPropagation()}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={card.content} alt="" className="w-full h-full object-cover rounded-xl pointer-events-none" draggable={false} />
              )}

              {/* Resize handle */}
              <div
                onPointerDown={e => startResize(e, card.id)}
                className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 cursor-nwse-resize opacity-0 group-hover:opacity-70"
                style={{ borderRight: '2px solid #fff', borderBottom: '2px solid #fff', borderRadius: '0 0 4px 0' }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
