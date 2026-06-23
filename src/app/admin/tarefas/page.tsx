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
  order: number
  createdAt: string
}

const COLUMNS = [
  { key: 'TODO', label: 'A Fazer', color: '#888' },
  { key: 'IN_PROGRESS', label: 'Em Andamento', color: '#60a5fa' },
  { key: 'REVIEW', label: 'Em Revisão', color: '#fbbf24' },
  { key: 'DONE', label: 'Concluído', color: '#D5FF40' },
]

const PRIORITIES = [
  { key: 'LOW', label: 'Baixa', color: '#555', bg: '#55555520' },
  { key: 'MEDIUM', label: 'Média', color: '#60a5fa', bg: '#60a5fa20' },
  { key: 'HIGH', label: 'Alta', color: '#fbbf24', bg: '#fbbf2420' },
  { key: 'URGENT', label: 'Urgente', color: '#f87171', bg: '#f8717120' },
]

const EMPTY_FORM = { title: '', description: '', priority: 'MEDIUM', dueDate: '', tags: '' }

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
  return { label: due.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), color: '#555' }
}

export default function TarefasPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [filterPriority, setFilterPriority] = useState<string | null>(null)
  const dragId = useRef<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/tarefas')
    setTasks(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openNew(column = 'TODO') {
    setEditingTask(null)
    setForm({ ...EMPTY_FORM })
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
    })
    setShowForm(true)
  }

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)
    const body = {
      ...form,
      dueDate: form.dueDate || null,
      column: editingTask?.column ?? 'TODO',
    }
    if (editingTask) {
      await fetch(`/api/tarefas/${editingTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } else {
      await fetch('/api/tarefas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    }
    setSaving(false)
    setShowForm(false)
    load()
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

  const inputCls = 'w-full px-3 py-2 rounded-lg text-sm text-white outline-none focus:ring-2 focus:ring-[#D5FF40]'
  const inputStyle = { background: '#1E1E1E', border: '1px solid #333' }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-6 border-b shrink-0" style={{ borderColor: '#2a2a2a' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Tarefas</h1>
            <p className="text-[#888] text-sm mt-0.5">
              {totalTasks} tarefas · {doneCount} concluídas
              {overdue > 0 && <span className="text-red-400 ml-2">· {overdue} atrasadas</span>}
              {todayCount > 0 && <span className="text-yellow-400 ml-2">· {todayCount} vencem hoje</span>}
            </p>
          </div>
          <button
            onClick={() => openNew()}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#1E1E1E]"
            style={{ background: '#D5FF40' }}
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
              background: !filterPriority ? '#D5FF40' : '#252525',
              color: !filterPriority ? '#1E1E1E' : '#888',
              border: '1px solid #333',
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
                background: filterPriority === p.key ? p.bg : '#252525',
                color: filterPriority === p.key ? p.color : '#888',
                border: `1px solid ${filterPriority === p.key ? p.color + '60' : '#333'}`,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-6">
        {loading ? (
          <div className="text-center py-16 text-[#555]">Carregando…</div>
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
                    background: isOver ? '#2a2a2a' : '#1f1f1f',
                    border: `1px solid ${isOver ? col.color + '60' : '#2a2a2a'}`,
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
                  <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: '#2a2a2a' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: col.color }} />
                      <span className="text-sm font-medium text-white">{col.label}</span>
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ background: '#2a2a2a', color: '#666' }}>
                        {colTasks.length}
                      </span>
                    </div>
                    <button
                      onClick={() => openNew(col.key)}
                      className="text-[#555] hover:text-[#D5FF40] transition-colors text-lg leading-none"
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
                          className="rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-[#444] transition-all group"
                          style={{ background: '#252525', border: '1px solid #333', opacity: isDone ? 0.6 : 1 }}
                        >
                          {/* Title + actions */}
                          <div className="flex items-start gap-2 mb-2">
                            <button
                              onClick={() => quickDone(task)}
                              className="shrink-0 mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all"
                              style={{
                                borderColor: isDone ? '#D5FF40' : '#444',
                                background: isDone ? '#D5FF40' : 'transparent',
                              }}
                              title={isDone ? 'Reabrir' : 'Concluir'}
                            >
                              {isDone && <span className="text-[#1E1E1E] text-xs leading-none">✓</span>}
                            </button>
                            <p className={`text-sm font-medium text-white flex-1 leading-tight ${isDone ? 'line-through text-[#555]' : ''}`}>
                              {task.title}
                            </p>
                            <button
                              onClick={() => openEdit(task)}
                              className="shrink-0 text-[#444] hover:text-white transition-colors text-xs opacity-0 group-hover:opacity-100"
                            >
                              ✎
                            </button>
                          </div>

                          {/* Description */}
                          {task.description && (
                            <p className="text-xs text-[#555] mb-2 line-clamp-2 pl-6">{task.description}</p>
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
                                <span key={tag} className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#333', color: '#666' }}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {colTasks.length === 0 && (
                      <div
                        className="text-center py-8 text-xs text-[#444] rounded-xl border-2 border-dashed cursor-pointer hover:border-[#555] transition-colors"
                        style={{ borderColor: '#2a2a2a' }}
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
          <div className="w-full max-w-md rounded-2xl" style={{ background: '#252525', border: '1px solid #333' }}>
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#333' }}>
              <h3 className="text-lg font-bold text-white">{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
              <button onClick={() => setShowForm(false)} className="text-[#555] hover:text-white transition-colors text-xl leading-none">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-[#888] mb-1 uppercase tracking-wide">Título *</label>
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
                <label className="block text-xs text-[#888] mb-1 uppercase tracking-wide">Descrição</label>
                <textarea
                  className={inputCls}
                  style={inputStyle}
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Detalhes adicionais…"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs text-[#888] mb-2 uppercase tracking-wide">Prioridade</label>
                <div className="grid grid-cols-4 gap-2">
                  {PRIORITIES.map(p => (
                    <button
                      key={p.key}
                      onClick={() => setForm(f => ({ ...f, priority: p.key }))}
                      className="py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: form.priority === p.key ? p.bg : '#1E1E1E',
                        color: form.priority === p.key ? p.color : '#666',
                        border: `1px solid ${form.priority === p.key ? p.color + '60' : '#333'}`,
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#888] mb-1 uppercase tracking-wide">Prazo</label>
                  <input
                    className={inputCls}
                    style={inputStyle}
                    type="date"
                    value={form.dueDate}
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#888] mb-1 uppercase tracking-wide">Tags</label>
                  <input
                    className={inputCls}
                    style={inputStyle}
                    value={form.tags}
                    onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    placeholder="Design, Cliente"
                  />
                </div>
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
                className="flex-1 py-2.5 rounded-xl text-sm text-[#888] hover:text-white transition-colors"
                style={{ background: '#1E1E1E', border: '1px solid #333' }}
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving || !form.title.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-[#1E1E1E] disabled:opacity-40"
                style={{ background: '#D5FF40' }}
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
