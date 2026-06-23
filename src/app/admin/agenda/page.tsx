'use client'

import { useState, useEffect, useCallback } from 'react'

type Appointment = {
  id: string
  title: string
  description?: string | null
  location?: string | null
  startAt: string
  endAt?: string | null
  allDay: boolean
  color: string
  source?: 'local'
}

type GCalEvent = {
  id: string
  title: string
  start: string
  end?: string
  allDay: boolean
  color: string | null
  location?: string | null
  description?: string | null
  source: 'google'
}

type CalEvent = {
  id: string
  title: string
  date: string // YYYY-MM-DD
  time?: string
  color: string
  type: 'appointment' | 'task' | 'transaction' | 'google' | 'holiday'
  raw?: Appointment | GCalEvent
}

type Task = { id: string; title: string; dueDate: string; priority: string }
type Transaction = { id: string; description: string; dueDate: string; type: string; status: string }

const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DAYS_PT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

const BR_HOLIDAYS_2026: Record<string, string> = {
  '2026-01-01': 'Ano Novo',
  '2026-02-16': 'Carnaval',
  '2026-02-17': 'Carnaval',
  '2026-03-03': 'Carnaval',
  '2026-04-03': 'Sexta-feira Santa',
  '2026-04-05': 'Páscoa',
  '2026-04-21': 'Tiradentes',
  '2026-05-01': 'Dia do Trabalho',
  '2026-06-04': 'Corpus Christi',
  '2026-09-07': 'Independência',
  '2026-10-12': 'Nossa Sra Aparecida',
  '2026-11-02': 'Finados',
  '2026-11-15': 'Proclamação da República',
  '2026-12-25': 'Natal',
}

const TYPE_COLORS = {
  appointment: '#60a5fa',
  task: '#a78bfa',
  transaction_in: '#34d399',
  transaction_out: '#f87171',
  google: '#34d399',
  holiday: '#f59e0b',
}

const EMPTY_FORM = {
  title: '',
  description: '',
  location: '',
  startAt: '',
  startTime: '09:00',
  endAt: '',
  endTime: '10:00',
  allDay: false,
  color: '#60a5fa',
}

export default function AgendaPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [gcalEvents, setGcalEvents] = useState<GCalEvent[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [gcalConnected, setGcalConnected] = useState(false)
  const [gcalLoading, setGcalLoading] = useState(false)
  const [showHolidays, setShowHolidays] = useState(true)
  const [showTasks, setShowTasks] = useState(true)
  const [showFinanceiro, setShowFinanceiro] = useState(true)
  const [showGoogle, setShowGoogle] = useState(true)
  const [modal, setModal] = useState<null | 'new' | 'edit' | 'view'>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    const [apptRes, taskRes, txRes] = await Promise.all([
      fetch(`/api/agenda?year=${year}&month=${month}`),
      fetch('/api/tarefas'),
      fetch(`/api/transacoes?year=${year}&month=${month}`),
    ])
    const [appts, taskList, txList] = await Promise.all([apptRes.json(), taskRes.json(), txRes.json()])
    setAppointments(appts)
    setTasks((taskList as Task[]).filter(t => t.dueDate))
    setTransactions(txList)

    // Google Calendar events
    setGcalLoading(true)
    try {
      const gcalRes = await fetch(`/api/agenda/google/events?year=${year}&month=${month}`)
      const gcalData = await gcalRes.json()
      setGcalConnected(gcalData.connected ?? false)
      setGcalEvents(gcalData.events ?? [])
    } finally {
      setGcalLoading(false)
    }
  }, [year, month])

  useEffect(() => { fetchData() }, [fetchData])

  // Check for gcal=connected in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('gcal') === 'connected') {
      setGcalConnected(true)
      window.history.replaceState({}, '', '/admin/agenda')
    }
  }, [])

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  function dateKey(day: number) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  // Build events per day
  const eventsByDay = new Map<string, CalEvent[]>()

  if (showHolidays) {
    Object.entries(BR_HOLIDAYS_2026).forEach(([date, name]) => {
      if (!eventsByDay.has(date)) eventsByDay.set(date, [])
      eventsByDay.get(date)!.push({ id: `h-${date}`, title: name, date, color: TYPE_COLORS.holiday, type: 'holiday' })
    })
  }

  appointments.forEach(a => {
    const date = a.startAt.slice(0, 10)
    if (!eventsByDay.has(date)) eventsByDay.set(date, [])
    const time = a.allDay ? undefined : a.startAt.slice(11, 16)
    eventsByDay.get(date)!.push({ id: a.id, title: a.title, date, time, color: a.color || TYPE_COLORS.appointment, type: 'appointment', raw: a })
  })

  if (showTasks) {
    tasks.forEach(t => {
      const date = t.dueDate.slice(0, 10)
      if (!eventsByDay.has(date)) eventsByDay.set(date, [])
      eventsByDay.get(date)!.push({ id: `t-${t.id}`, title: t.title, date, color: TYPE_COLORS.task, type: 'task' })
    })
  }

  if (showFinanceiro) {
    transactions.forEach(tx => {
      const date = tx.dueDate.slice(0, 10)
      if (!eventsByDay.has(date)) eventsByDay.set(date, [])
      const color = tx.type === 'INCOME' ? TYPE_COLORS.transaction_in : TYPE_COLORS.transaction_out
      eventsByDay.get(date)!.push({ id: `tx-${tx.id}`, title: tx.description, date, color, type: 'transaction' })
    })
  }

  if (showGoogle && gcalConnected) {
    gcalEvents.forEach(e => {
      const date = (e.start ?? '').slice(0, 10)
      if (!date) return
      if (!eventsByDay.has(date)) eventsByDay.set(date, [])
      const time = !e.allDay ? (e.start ?? '').slice(11, 16) : undefined
      eventsByDay.get(date)!.push({ id: `g-${e.id}`, title: e.title, date, time, color: e.color ?? TYPE_COLORS.google, type: 'google', raw: e })
    })
  }

  function openNew(day: number) {
    const d = dateKey(day)
    setForm({ ...EMPTY_FORM, startAt: d, endAt: d })
    setSelectedDay(d)
    setEditId(null)
    setModal('new')
  }

  function openEdit(ev: CalEvent) {
    if (ev.type !== 'appointment' || !ev.raw) return
    const a = ev.raw as Appointment
    const startDate = a.startAt.slice(0, 10)
    const startTime = a.startAt.length > 10 ? a.startAt.slice(11, 16) : '09:00'
    const endDate = a.endAt?.slice(0, 10) ?? startDate
    const endTime = a.endAt && a.endAt.length > 10 ? a.endAt.slice(11, 16) : '10:00'
    setForm({
      title: a.title,
      description: a.description ?? '',
      location: a.location ?? '',
      startAt: startDate,
      startTime,
      endAt: endDate,
      endTime,
      allDay: a.allDay,
      color: a.color ?? '#60a5fa',
    })
    setEditId(a.id)
    setModal('edit')
  }

  async function saveAppointment() {
    setSaving(true)
    const startAt = form.allDay ? form.startAt : `${form.startAt}T${form.startTime}:00`
    const endAt = form.allDay ? form.endAt || form.startAt : `${form.endAt || form.startAt}T${form.endTime}:00`
    const body = { title: form.title, description: form.description, location: form.location, startAt, endAt, allDay: form.allDay, color: form.color }
    if (editId) {
      await fetch(`/api/agenda/${editId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    } else {
      await fetch('/api/agenda', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setSaving(false)
    setModal(null)
    fetchData()
  }

  async function deleteAppointment(id: string) {
    await fetch(`/api/agenda/${id}`, { method: 'DELETE' })
    setModal(null)
    fetchData()
  }

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#D5FF40]'
  const inputStyle = { background: '#1E1E1E', border: '1px solid #333' }

  const COLORS = ['#60a5fa','#a78bfa','#f472b6','#fb923c','#facc15','#34d399','#f87171','#e2e8f0']

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b shrink-0" style={{ borderColor: '#2a2a2a' }}>
        <div>
          <h1 className="text-2xl font-bold text-white">Agenda</h1>
          <p className="text-[#888] text-sm mt-0.5">Calendário de eventos, tarefas e compromissos</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Google Connect */}
          {gcalConnected ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={{ background: '#1a2e1a', border: '1px solid #22c55e33' }}>
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
              <span className="text-green-400 font-medium">Google Agenda conectado</span>
            </div>
          ) : (
            <a
              href="/api/agenda/google/auth"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: '#252525', border: '1px solid #444', color: '#fff' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Conectar Google Agenda
            </a>
          )}
          <button
            onClick={() => { setForm(EMPTY_FORM); setEditId(null); setModal('new') }}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: '#D5FF40', color: '#1E1E1E' }}
          >
            + Novo evento
          </button>
        </div>
      </div>

      {/* Toggles + Nav */}
      <div className="flex items-center justify-between px-8 py-3 border-b shrink-0" style={{ borderColor: '#2a2a2a' }}>
        {/* Month nav */}
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#888] hover:text-white hover:bg-[#252525]">‹</button>
          <span className="text-white font-semibold text-base min-w-[160px] text-center">
            {MONTHS_PT[month - 1]} {year}
          </span>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#888] hover:text-white hover:bg-[#252525]">›</button>
          <button
            onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth() + 1) }}
            className="px-3 py-1 rounded-lg text-xs font-medium text-[#888] hover:text-white hover:bg-[#252525] ml-1"
          >
            Hoje
          </button>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-2">
          {[
            { label: 'Feriados', key: 'holidays', active: showHolidays, toggle: () => setShowHolidays(v => !v), color: TYPE_COLORS.holiday },
            { label: 'Tarefas', key: 'tasks', active: showTasks, toggle: () => setShowTasks(v => !v), color: TYPE_COLORS.task },
            { label: 'Financeiro', key: 'fin', active: showFinanceiro, toggle: () => setShowFinanceiro(v => !v), color: TYPE_COLORS.transaction_in },
            ...(gcalConnected ? [{ label: 'Google', key: 'google', active: showGoogle, toggle: () => setShowGoogle(v => !v), color: TYPE_COLORS.google }] : []),
          ].map(t => (
            <button
              key={t.key}
              onClick={t.toggle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: t.active ? `${t.color}22` : '#252525',
                border: `1px solid ${t.active ? t.color : '#333'}`,
                color: t.active ? t.color : '#666',
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: t.active ? t.color : '#555' }} />
              {t.label}
            </button>
          ))}
          {gcalLoading && <span className="text-xs text-[#555]">sincronizando…</span>}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto px-8 py-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS_PT.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-[#555] uppercase py-2">{d}</div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7 gap-1" style={{ gridAutoRows: 'minmax(110px, auto)' }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />
            const key = dateKey(day)
            const isToday = key === todayKey
            const dayEvents = eventsByDay.get(key) ?? []
            const MAX_SHOW = 3

            return (
              <div
                key={key}
                onClick={() => openNew(day)}
                className="rounded-xl p-2 cursor-pointer group transition-all"
                style={{
                  background: isToday ? '#1a2a1a' : '#252525',
                  border: `1px solid ${isToday ? '#D5FF4044' : '#2a2a2a'}`,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full"
                    style={{
                      background: isToday ? '#D5FF40' : 'transparent',
                      color: isToday ? '#1E1E1E' : '#888',
                    }}
                  >
                    {day}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, MAX_SHOW).map(ev => (
                    <div
                      key={ev.id}
                      onClick={e => { e.stopPropagation(); if (ev.type === 'appointment') openEdit(ev) }}
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium truncate cursor-pointer transition-opacity hover:opacity-80"
                      style={{ background: `${ev.color}33`, color: ev.color, border: `1px solid ${ev.color}44` }}
                      title={ev.title}
                    >
                      {ev.time ? `${ev.time} ` : ''}{ev.title}
                    </div>
                  ))}
                  {dayEvents.length > MAX_SHOW && (
                    <div className="text-[10px] text-[#666] px-1">+{dayEvents.length - MAX_SHOW} mais</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-8 py-3 border-t flex items-center gap-4 shrink-0" style={{ borderColor: '#2a2a2a' }}>
        {[
          { label: 'Compromissos', color: TYPE_COLORS.appointment },
          { label: 'Tarefas', color: TYPE_COLORS.task },
          { label: 'Receitas', color: TYPE_COLORS.transaction_in },
          { label: 'Despesas', color: TYPE_COLORS.transaction_out },
          { label: 'Feriados', color: TYPE_COLORS.holiday },
          ...(gcalConnected ? [{ label: 'Google Calendar', color: TYPE_COLORS.google }] : []),
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
            <span className="text-xs text-[#666]">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Modal */}
      {(modal === 'new' || modal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-5" style={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{modal === 'edit' ? 'Editar evento' : 'Novo evento'}</h2>
              <button onClick={() => setModal(null)} className="text-[#666] hover:text-white text-xl">×</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[#888] mb-1.5 uppercase tracking-wide">Título</label>
                <input
                  autoFocus
                  className={inputCls}
                  style={inputStyle}
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Título do evento"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.allDay}
                    onChange={e => setForm(f => ({ ...f, allDay: e.target.checked }))}
                    className="accent-[#D5FF40]"
                  />
                  <span className="text-sm text-[#888]">Dia inteiro</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#888] mb-1.5 uppercase tracking-wide">Data início</label>
                  <input type="date" className={inputCls} style={inputStyle} value={form.startAt} onChange={e => setForm(f => ({ ...f, startAt: e.target.value }))} />
                </div>
                {!form.allDay && (
                  <div>
                    <label className="block text-xs text-[#888] mb-1.5 uppercase tracking-wide">Hora início</label>
                    <input type="time" className={inputCls} style={inputStyle} value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
                  </div>
                )}
                <div>
                  <label className="block text-xs text-[#888] mb-1.5 uppercase tracking-wide">Data fim</label>
                  <input type="date" className={inputCls} style={inputStyle} value={form.endAt} onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))} />
                </div>
                {!form.allDay && (
                  <div>
                    <label className="block text-xs text-[#888] mb-1.5 uppercase tracking-wide">Hora fim</label>
                    <input type="time" className={inputCls} style={inputStyle} value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-[#888] mb-1.5 uppercase tracking-wide">Local</label>
                <input className={inputCls} style={inputStyle} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Endereço ou link" />
              </div>

              <div>
                <label className="block text-xs text-[#888] mb-1.5 uppercase tracking-wide">Descrição</label>
                <textarea
                  className={inputCls}
                  style={{ ...inputStyle, resize: 'none' }}
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Observações…"
                />
              </div>

              <div>
                <label className="block text-xs text-[#888] mb-2 uppercase tracking-wide">Cor</label>
                <div className="flex items-center gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                      style={{
                        background: c,
                        outline: form.color === c ? `2px solid ${c}` : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              {modal === 'edit' && editId && (
                <button
                  onClick={() => deleteAppointment(editId)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  Excluir
                </button>
              )}
              <div className="flex-1" />
              <button onClick={() => setModal(null)} className="px-4 py-2.5 rounded-xl text-sm text-[#888] hover:text-white">
                Cancelar
              </button>
              <button
                onClick={saveAppointment}
                disabled={!form.title || !form.startAt || saving}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: '#D5FF40', color: '#1E1E1E' }}
              >
                {saving ? 'Salvando…' : modal === 'edit' ? 'Salvar' : 'Criar evento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
