'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

type Task = {
  id: string
  title: string
  description: string | null
  column: string
  priority: string
  dueDate: string | null
  tags: string | null
  imageUrl: string | null
  links: string | null
  order: number
  createdAt: string
}

const COLUMNS = [
  { key: 'TODO', label: 'A Fazer', color: '#a8a296' },
  { key: 'IN_PROGRESS', label: 'Em Andamento', color: '#60a5fa' },
  { key: 'REVIEW', label: 'Em Revisão', color: '#fbbf24' },
  { key: 'DONE', label: 'Concluído', color: '#e8b84b' },
]

const PRIORITIES = [
  { key: 'LOW', label: 'Baixa', color: '#6e6a60', bg: '#6e6a6020' },
  { key: 'MEDIUM', label: 'Média', color: '#60a5fa', bg: '#60a5fa20' },
  { key: 'HIGH', label: 'Alta', color: '#fbbf24', bg: '#fbbf2420' },
  { key: 'URGENT', label: 'Urgente', color: '#f87171', bg: '#f8717120' },
]

const EMPTY_FORM = { title: '', description: '', priority: 'MEDIUM', dueDate: '', tags: '', imageUrl: '', links: '', column: 'TODO' }

function normalizeLink(link: string): string {
  return /^https?:\/\//i.test(link) ? link : `https://${link}`
}

function linkLabel(link: string): string {
  try { return new URL(normalizeLink(link)).hostname.replace(/^www\./, '') } catch { return link }
}

function parseLinks(links: string | null): string[] {
  if (!links) return []
  return links.split(/[\n,]/).map(l => l.trim()).filter(Boolean)
}

function getPriority(key: string) {
  return PRIORITIES.find(p => p.key === key) ?? PRIORITIES[1]
}

function getDueInfo(dueDate: string | null): { label: string; color: string } | null {
  if (!dueDate) return null
  const due = new Date(dueDate)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { label: `Atrasada ${Math.abs(diff)}d`, color: '#f87171' }
  if (diff === 0) return { label: 'Hoje', color: '#fbbf24' }
  if (diff === 1) return { label: 'Amanhã', color: '#fbbf24' }
  if (diff <= 3) return { label: `${diff} dias`, color: '#fbbf24' }
  return { label: due.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), color: '#6e6a60' }
}

export default function TarefasPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [filterPriority, setFilterPriority] = useState<string | null>(null)
  const dragId = useRef<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/tarefas')
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setLoadError(`Erro ${res.status}: ${(err as { error?: string }).error ?? 'falha ao carregar tarefas'}`)
        setTasks([])
        return
      }
      const data = await res.json()
      setTasks(Array.isArray(data) ? data : [])
      setLoadError(null)
    } catch {
      setLoadError('Erro de rede ao carregar tarefas')
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openNew(column = 'TODO') {
    setEditingTask(null)
    setForm({ ...EMPTY_FORM, column })
    setShowForm(true)
  }

  function openEdit(task: Task) {
    setEditingTask(task)
    setForm({
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      tags: task.tags ?? '',
      imageUrl: task.imageUrl ?? '',
      links: task.links ?? '',
      column: task.column,
    })
    setShowForm(true)
  }

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const body = {
        title: form.title,
        description: form.description,
        priority: form.priority,
        dueDate: form.dueDate || null,
        tags: form.tags,
        imageUrl: form.imageUrl,
        links: form.links,
        column: editingTask?.column ?? form.column,
      }
      let res: Response
      if (editingTask) {
        res = await fetch(`/api/tarefas/${editingTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch('/api/tarefas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(`Erro ao salvar: ${(err as { error?: string }).error ?? res.status}`)
        return
      }
      setShowForm(false)
      load()
    } catch {
      alert('Erro ao salvar tarefa. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('files', file)
      fd.append('webp', '1')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) { alert('Erro ao enviar a imagem.'); return }
      const data = await res.json()
      const url = data.urls?.[0]
      if (url) setForm(f => ({ ...f, imageUrl: url }))
    } catch {
      alert('Erro ao enviar a imagem.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function deleteTask(id: string) {
    if (!confirm('Excluir tarefa?')) return
    await fetch(`/api/tarefas/${id}`, { method: 'DELETE' })
    load()
  }

  async function moveToColumn(taskId: string, column: string) {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, column } : t))
    await fetch(`/api/tarefas/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column }),
    })
  }

  async function quickDone(task: Task) {
    const next = task.column === 'DONE' ? 'TODO' : 'DONE'
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, column: next } : t))
    await fetch(`/api/tarefas/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column: next }),
    })
  }

  const byColumn = (col: string) => tasks
    .filter(t => t.column === col && (!filterPriority || t.priority === filterPriority))

  const totalTasks = tasks.length
  const overdue = tasks.filter(t => t.dueDate && t.column !== 'DONE' && new Date(t.dueDate) < new Date()).length
  const doneCount = tasks.filter(t => t.column === 'DONE').length
  const todayCount = tasks.filter(t => {
    if (!t.dueDate || t.column === 'DONE') return false
    const d = new Date(t.dueDate); d.setHours(0,0,0,0)
    const n = new Date(); n.setHours(0,0,0,0)
    return d.getTime() === n.getTime()
  }).length

  const inputCls = 'w-full px-3 py-2 rounded-lg text-sm text-white outline-none focus:ring-2 focus:ring-[#e8b84b]'
  const inputStyle = { background: '#09090a', border: '1px solid rgba(255,255,255,0.1)' }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-6 border-b shrink-0" style={{ borderColor: '#1c1b1e' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Tarefas</h1>
            <p className="text-[#a8a296] text-sm mt-0.5">
              {totalTasks} tarefas · {doneCount} concluídas
              {overdue > 0 && <span className="text-red-400 ml-2">· {overdue} atrasadas</span>}
              {todayCount > 0 && <span className="text-yellow-400 ml-2">· {todayCount} vencem hoje</span>}
            </p>
          </div>
          <button
            onClick={() => openNew()}
            className="px-5 py-2.5 rounded-full text-sm font-semibold text-[#09090a]"
            style={{ background: '#e8b84b' }}
          >
            + Nova Tarefa
          </button>
        </div>

        {/* Priority filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterPriority(null)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-all"
            style={{
              background: !filterPriority ? '#e8b84b' : '#161518',
              color: !filterPriority ? '#09090a' : '#a8a296',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            Todas
          </button>
          {PRIORITIES.map(p => (
            <button
              key={p.key}
              onClick={() => setFilterPriority(filterPriority === p.key ? null : p.key)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                background: filterPriority === p.key ? p.bg : '#161518',
                color: filterPriority === p.key ? p.color : '#a8a296',
                border: `1px solid ${filterPriority === p.key ? p.color + '60' : 'rgba(255,255,255,0.1)'}`,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-6">
        {loadError && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-300 border border-red-500/30" style={{ background: '#3a1a1a' }}>
            ⚠️ {loadError} — verifique se a tabela Task existe no banco (rode migration_v4.sql no DbGate)
          </div>
        )}
        {loading ? (
          <div className="text-center py-16 text-[#6e6a60]">Carregando…</div>
        ) : (
          <div className="flex gap-4 h-full" style={{ minWidth: `${COLUMNS.length * 300}px` }}>
            {COLUMNS.map(col => {
              const colTasks = byColumn(col.key)
              const isOver = dragOver === col.key
              return (
                <div
                  key={col.key}
                  className="flex flex-col rounded-2xl transition-all"
                  style={{
                    width: 292,
                    minWidth: 292,
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
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ background: '#1c1b1e', color: '#6e6a60' }}>
                        {colTasks.length}
                      </span>
                    </div>
                    <button
                      onClick={() => openNew(col.key)}
                      className="text-[#6e6a60] hover:text-[#e8b84b] transition-colors text-lg leading-none"
                      title="Nova tarefa nesta coluna"
                    >
                      +
                    </button>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {colTasks.map(task => {
                      const prio = getPriority(task.priority)
                      const due = getDueInfo(task.dueDate)
                      const isDone = task.column === 'DONE'
                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => { dragId.current = task.id }}
                          onDragEnd={() => { dragId.current = null; setDragOver(null) }}
                          className="rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-[rgba(255,255,255,0.16)] transition-all group"
                          style={{ background: '#161518', border: '1px solid rgba(255,255,255,0.1)', opacity: isDone ? 0.6 : 1 }}
                        >
                          {/* Title + actions */}
                          <div className="flex items-start gap-2 mb-2">
                            <button
                              onClick={() => quickDone(task)}
                              className="shrink-0 mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all"
                              style={{
                                borderColor: isDone ? '#e8b84b' : 'rgba(255,255,255,0.16)',
                                background: isDone ? '#e8b84b' : 'transparent',
                              }}
                              title={isDone ? 'Reabrir' : 'Concluir'}
                            >
                              {isDone && <span className="text-[#09090a] text-xs leading-none">✓</span>}
                            </button>
                            <p className={`text-sm font-medium text-white flex-1 leading-tight ${isDone ? 'line-through text-[#6e6a60]' : ''}`}>
                              {task.title}
                            </p>
                            <button
                              onClick={() => openEdit(task)}
                              className="shrink-0 text-[rgba(255,255,255,0.16)] hover:text-white transition-colors text-xs opacity-0 group-hover:opacity-100"
                            >
                              ✎
                            </button>
                          </div>

                          {/* Description */}
                          {task.description && (
                            <p className="text-xs text-[#6e6a60] mb-2 line-clamp-2 pl-6">{task.description}</p>
                          )}

                          {/* Imagem */}
                          {task.imageUrl && (
                            <div className="pl-6 mb-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={task.imageUrl} alt="" className="w-full max-h-28 object-cover rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
                            </div>
                          )}

                          {/* Footer: priority + due */}
                          <div className="flex items-center justify-between pl-6">
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: prio.bg, color: prio.color }}
                            >
                              {prio.label}
                            </span>
                            {due && (
                              <span className="text-xs font-medium" style={{ color: due.color }}>
                                {due.label}
                              </span>
                            )}
                          </div>

                          {/* Tags */}
                          {task.tags && (
                            <div className="flex flex-wrap gap-1 mt-2 pl-6">
                              {task.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                                <span key={tag} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.1)', color: '#6e6a60' }}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Links */}
                          {task.links && parseLinks(task.links).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2 pl-6">
                              {parseLinks(task.links).map((link, i) => (
                                <a
                                  key={i}
                                  href={normalizeLink(link)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  draggable={false}
                                  className="text-xs px-1.5 py-0.5 rounded inline-flex items-center gap-1 hover:underline max-w-full truncate"
                                  style={{ background: '#2a3320', color: '#e8b84b' }}
                                >
                                  🔗 {linkLabel(link)}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {colTasks.length === 0 && (
                      <div
                        className="text-center py-8 text-xs text-[rgba(255,255,255,0.16)] rounded-xl border-2 border-dashed cursor-pointer hover:border-[#6e6a60] transition-colors"
                        style={{ borderColor: '#1c1b1e' }}
                        onClick={() => openNew(col.key)}
                      >
                        + Adicionar tarefa
                      </div>
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
          <div className="w-full max-w-md rounded-2xl" style={{ background: '#161518', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <h3 className="text-lg font-bold text-white">{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
              <button onClick={() => setShowForm(false)} className="text-[#6e6a60] hover:text-white transition-colors text-xl leading-none">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-[#a8a296] mb-1 uppercase tracking-wide font-mono">Título *</label>
                <input
                  className={inputCls}
                  style={inputStyle}
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Descreva a tarefa…"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs text-[#a8a296] mb-1 uppercase tracking-wide font-mono">Descrição</label>
                <textarea
                  className={inputCls}
                  style={inputStyle}
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Detalhes adicionais…"
                />
              </div>

              {/* Imagem */}
              <div>
                <label className="block text-xs text-[#a8a296] mb-1 uppercase tracking-wide font-mono">Imagem</label>
                {form.imageUrl ? (
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.imageUrl} alt="anexo" className="max-h-32 rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-sm text-white"
                      style={{ background: '#f87171' }}
                      title="Remover imagem"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label
                    className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm cursor-pointer text-[#a8a296] hover:text-white transition-colors"
                    style={{ background: '#09090a', border: '1px dashed rgba(255,255,255,0.1)' }}
                  >
                    {uploading ? 'Enviando…' : '+ Anexar imagem'}
                    <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handleImageUpload} />
                  </label>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs text-[#a8a296] mb-2 uppercase tracking-wide font-mono">Prioridade</label>
                <div className="grid grid-cols-4 gap-2">
                  {PRIORITIES.map(p => (
                    <button
                      key={p.key}
                      onClick={() => setForm(f => ({ ...f, priority: p.key }))}
                      className="py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: form.priority === p.key ? p.bg : '#09090a',
                        color: form.priority === p.key ? p.color : '#6e6a60',
                        border: `1px solid ${form.priority === p.key ? p.color + '60' : 'rgba(255,255,255,0.1)'}`,
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#a8a296] mb-1 uppercase tracking-wide font-mono">Prazo</label>
                  <input
                    className={inputCls}
                    style={inputStyle}
                    type="date"
                    value={form.dueDate}
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#a8a296] mb-1 uppercase tracking-wide font-mono">Tags</label>
                  <input
                    className={inputCls}
                    style={inputStyle}
                    value={form.tags}
                    onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    placeholder="Design, Cliente"
                  />
                </div>
              </div>

              {/* Links */}
              <div>
                <label className="block text-xs text-[#a8a296] mb-1 uppercase tracking-wide font-mono">Links</label>
                <textarea
                  className={inputCls}
                  style={inputStyle}
                  rows={2}
                  value={form.links}
                  onChange={e => setForm(f => ({ ...f, links: e.target.value }))}
                  placeholder="Um link por linha (ex.: https://figma.com/...)"
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              {editingTask && (
                <button
                  onClick={() => { setShowForm(false); deleteTask(editingTask.id) }}
                  className="px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  Excluir
                </button>
              )}
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm text-[#a8a296] hover:text-white transition-colors"
                style={{ background: '#09090a', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving || !form.title.trim()}
                className="flex-1 py-2.5 rounded-full text-sm font-semibold text-[#09090a] disabled:opacity-40"
                style={{ background: '#e8b84b' }}
              >
                {saving ? 'Salvando…' : editingTask ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
