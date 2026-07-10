'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SHORTCODE_GROUPS, DEFAULT_CONTRACT_TEMPLATE } from '@/lib/contracts'

type Template = { id: string; name: string; content: string; isDefault: boolean; createdAt: string }
type Contract = { id: string; clientName: string; projectName: string; totalValue: number; finalValue: number; createdAt: string }
type Client = { id: string; name: string; email?: string | null; phone?: string | null; document?: string | null; company?: string | null; address?: string | null; neighborhood?: string | null; city?: string | null; state?: string | null }

const PAYMENT_METHODS = ['PIX', 'Boleto', 'Transferência Bancária', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Outros']

const EMPTY_NOVO = {
  templateId: '', clientId: '', clientName: '', clientDocument: '', clientRepresentative: '',
  clientEmail: '', clientPhone: '', clientAddress: '', clientAddressNumber: '',
  clientNeighborhood: '', clientCity: '', clientState: '',
  projectName: '', services: '', duration: '90 dias a partir da assinatura',
  totalValue: '', discount: '0', finalValue: '', installments: '1',
  paymentMethod: 'PIX', paymentConditions: 'À vista',
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ─── Shortcode-aware textarea: insert shortcode at cursor ──────────────────
function TemplateEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function insertAtCursor(code: string) {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const next = value.slice(0, start) + code + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + code.length, start + code.length)
    })
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Editor */}
      <div className="flex-1 flex flex-col gap-2">
        <label className="text-sm font-medium text-[#a8a296]">Modelo do Contrato</label>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 rounded-xl border text-sm font-mono leading-relaxed resize-none p-4 focus:outline-none focus:border-red-500 transition-colors"
          style={{ background: '#0f0f11', borderColor: 'rgba(255,255,255,0.1)', color: '#a8a296', minHeight: 420 }}
          placeholder="Texto do contrato com {{shortcodes}}..."
          spellCheck={false}
        />
      </div>

      {/* Shortcodes panel */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: 520 }}>
        <div>
          <p className="text-sm font-semibold text-white mb-0.5">Shortcodes Disponíveis</p>
          <p className="text-xs text-[#6e6a60]">Clique para inserir no modelo</p>
        </div>
        {SHORTCODE_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-xs font-semibold mb-2" style={{ color: '#ef4444' }}>{group.label}</p>
            <div className="flex flex-col gap-1.5">
              {group.codes.map(({ code, desc }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => insertAtCursor(code)}
                  className="text-left group"
                >
                  <span
                    className="inline-block text-xs px-2 py-1 rounded-lg font-mono transition-colors group-hover:bg-red-500/20"
                    style={{ background: '#2a1a1a', color: '#ef4444', border: '1px solid #3a1a1a' }}
                  >
                    {code}
                  </span>
                  <span className="block text-[11px] text-[#6e6a60] mt-0.5 pl-1">{desc}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Modal Modelos ─────────────────────────────────────────────────────────
function ModelosModal({
  onClose, templates, loadTemplates,
}: {
  onClose: () => void
  templates: Template[]
  loadTemplates: () => Promise<void>
}) {
  const [view, setView] = useState<'list' | 'edit'>('list')
  const [editing, setEditing] = useState<Template | null>(null)
  const [editName, setEditName] = useState('')
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  function openNew() {
    setEditing(null)
    setEditName('')
    setEditContent(DEFAULT_CONTRACT_TEMPLATE)
    setView('edit')
  }

  function openEdit(t: Template) {
    setEditing(t)
    setEditName(t.name)
    setEditContent(t.content)
    setView('edit')
  }

  async function save() {
    if (!editName.trim()) return
    setSaving(true)
    try {
      if (editing) {
        const res = await fetch(`/api/contratos/modelos/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: editName, content: editContent, isDefault: editing.isDefault }),
        })
        if (!res.ok) { alert('Erro ao salvar modelo'); return }
      } else {
        const isFirst = templates.length === 0
        const res = await fetch('/api/contratos/modelos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: editName, content: editContent, isDefault: isFirst }),
        })
        if (!res.ok) { alert('Erro ao criar modelo'); return }
      }
      await loadTemplates()
      setView('list')
    } finally {
      setSaving(false)
    }
  }

  async function del(id: string) {
    if (!confirm('Deletar este modelo?')) return
    setDeleting(id)
    try {
      await fetch(`/api/contratos/modelos/${id}`, { method: 'DELETE' })
      await loadTemplates()
    } finally {
      setDeleting(null)
    }
  }

  async function restoreDefault() {
    if (!confirm('Isso sobrescreverá o conteúdo atual com o template padrão. Continuar?')) return
    setEditContent(DEFAULT_CONTRACT_TEMPLATE)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="rounded-2xl border w-full flex flex-col" style={{ background: '#161518', borderColor: 'rgba(255,255,255,0.1)', maxWidth: view === 'edit' ? 1100 : 560, maxHeight: '92vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-3">
            {view === 'edit' && (
              <button onClick={() => setView('list')} className="text-[#a8a296] hover:text-white transition-colors text-lg">←</button>
            )}
            <div>
              <h2 className="font-semibold text-white text-lg flex items-center gap-2">
                <span>◻</span>
                {view === 'list' ? 'Modelos de Contrato' : (editing ? 'Editar Modelo' : 'Novo Modelo')}
              </h2>
              {view === 'list' && (
                <p className="text-xs text-[#6e6a60] mt-0.5">Gerencie seus modelos de contrato. O modelo padrão será usado automaticamente ao criar novos contratos.</p>
              )}
              {view === 'edit' && (
                <p className="text-xs text-[#6e6a60] mt-0.5">Personalize o modelo de contrato usando os shortcodes disponíveis</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-[#6e6a60] hover:text-white transition-colors text-xl w-8 h-8 flex items-center justify-center">×</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {view === 'list' ? (
            <div className="flex flex-col gap-4">
              <button
                onClick={openNew}
                className="w-full py-4 rounded-2xl border-2 border-dashed text-white font-medium text-sm hover:border-red-500 hover:text-red-400 transition-colors flex items-center justify-center gap-2"
                style={{ borderColor: 'rgba(255,255,255,0.16)' }}
              >
                + Novo modelo
              </button>

              {templates.length === 0 && (
                <p className="text-center text-[#6e6a60] text-sm py-4">Nenhum modelo criado ainda.</p>
              )}

              {templates.map(t => (
                <div key={t.id} className="rounded-2xl border p-4 flex items-start justify-between gap-4" style={{ background: '#09090a', borderColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-white">{t.name}</p>
                      {t.isDefault && (
                        <span className="text-xs px-2 py-0.5 rounded-full border" style={{ color: '#facc15', borderColor: '#facc15', background: 'rgba(250,204,21,0.1)' }}>
                          ☆ Padrão
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6e6a60] line-clamp-2">{t.content.slice(0, 120)}...</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => openEdit(t)} className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.1)] text-[#a8a296] hover:text-white transition-colors" title="Editar">✎</button>
                    <button
                      onClick={() => del(t.id)}
                      disabled={deleting === t.id}
                      className="p-2 rounded-lg hover:bg-red-900/30 text-[#a8a296] hover:text-red-400 transition-colors"
                      title="Deletar"
                    >
                      {deleting === t.id ? '...' : '🗑'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4 h-full">
              <div>
                <label className="text-sm font-medium text-[#a8a296] block mb-1.5">Nome do modelo</label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Ex: Template Padrão"
                  className="w-full px-4 py-3 rounded-xl border text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                  style={{ background: '#0f0f11', borderColor: 'rgba(255,255,255,0.1)' }}
                />
              </div>
              <div className="flex-1">
                <TemplateEditor value={editContent} onChange={setEditContent} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {view === 'edit' && (
          <div className="px-6 py-4 border-t flex items-center gap-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <button
              onClick={save}
              disabled={saving || !editName.trim()}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ background: '#ef4444' }}
            >
              {saving ? 'Salvando...' : 'Salvar modelo'}
            </button>
            <button
              onClick={restoreDefault}
              className="px-4 py-2.5 rounded-xl text-sm font-medium border text-[#a8a296] hover:text-white hover:border-[#6e6a60] transition-colors"
              style={{ borderColor: 'rgba(255,255,255,0.16)' }}
            >
              Restaurar Padrão
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Modal Novo Contrato ───────────────────────────────────────────────────
function NovoContratoModal({
  onClose, templates, onCreated,
}: {
  onClose: () => void
  templates: Template[]
  onCreated: (id: string) => void
}) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ ...EMPTY_NOVO })
  const [clients, setClients] = useState<Client[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/clientes').then(r => r.json()).then(d => { if (Array.isArray(d)) setClients(d) }).catch(() => {})
    if (templates.length > 0) {
      const def = templates.find(t => t.isDefault) ?? templates[0]
      setForm(f => ({ ...f, templateId: def.id }))
    }
  }, [templates])

  // Auto-calc final value
  useEffect(() => {
    const total = parseFloat(form.totalValue) || 0
    const disc = parseFloat(form.discount) || 0
    setForm(f => ({ ...f, finalValue: String(Math.max(0, total - disc)) }))
  }, [form.totalValue, form.discount])

  function set(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function selectClient(c: Client) {
    setForm(f => ({
      ...f,
      clientId: c.id,
      clientName: c.name,
      clientDocument: c.document || '',
      clientEmail: c.email || '',
      clientPhone: c.phone || '',
      clientAddress: c.address || '',
      clientNeighborhood: c.neighborhood || '',
      clientCity: c.city || '',
      clientState: c.state || '',
      clientRepresentative: c.name,
    }))
  }

  async function generate() {
    if (!form.clientName.trim() || !form.projectName.trim()) return
    setSaving(true)
    try {
      const selectedTemplate = templates.find(t => t.id === form.templateId)
      const res = await fetch('/api/contratos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: form.templateId || null,
          templateContent: selectedTemplate?.content ?? '',
          clientName: form.clientName,
          clientDocument: form.clientDocument,
          clientRepresentative: form.clientRepresentative,
          clientEmail: form.clientEmail,
          clientPhone: form.clientPhone,
          clientAddress: form.clientAddress,
          clientAddressNumber: form.clientAddressNumber,
          clientNeighborhood: form.clientNeighborhood,
          clientCity: form.clientCity,
          clientState: form.clientState,
          projectName: form.projectName,
          services: form.services,
          duration: form.duration,
          totalValue: parseFloat(form.totalValue) || 0,
          discount: parseFloat(form.discount) || 0,
          finalValue: parseFloat(form.finalValue) || 0,
          installments: parseInt(form.installments) || 1,
          paymentMethod: form.paymentMethod,
          paymentConditions: form.paymentConditions,
        }),
      })
      if (!res.ok) { alert('Erro ao gerar contrato'); return }
      const data = await res.json()
      onCreated(data.id)
    } finally {
      setSaving(false)
    }
  }

  const inp = 'w-full px-4 py-3 rounded-xl border text-sm text-white focus:outline-none focus:border-red-500 transition-colors'
  const inpStyle = { background: '#0f0f11', borderColor: 'rgba(255,255,255,0.1)' }
  const labelCls = 'text-sm font-medium text-[#a8a296] block mb-1.5'

  const TABS = ['Dados Básicos', 'Dados do Cliente', 'Dados Financeiros']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="rounded-2xl border w-full flex flex-col" style={{ background: '#161518', borderColor: 'rgba(255,255,255,0.1)', maxWidth: 680, maxHeight: '90vh' }}>

        {/* Header */}
        <div className="px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white text-lg">Novo Contrato</h2>
            <button onClick={onClose} className="text-[#6e6a60] hover:text-white transition-colors text-xl w-8 h-8 flex items-center justify-center">×</button>
          </div>
          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setStep(i + 1)}
                className="pb-3 px-4 text-sm font-medium border-b-2 transition-colors"
                style={{
                  borderColor: step === i + 1 ? '#ef4444' : 'transparent',
                  color: step === i + 1 ? '#ef4444' : '#6e6a60',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <label className={labelCls}>Modelo de contrato</label>
                <select
                  value={form.templateId}
                  onChange={e => set('templateId', e.target.value)}
                  className={inp}
                  style={inpStyle}
                >
                  {templates.length === 0 && <option value="">Nenhum modelo criado</option>}
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}{t.isDefault ? ' (padrão)' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Cliente</label>
                <select
                  value={form.clientId}
                  onChange={e => {
                    const c = clients.find(c => c.id === e.target.value)
                    if (c) selectClient(c)
                    else setForm(f => ({ ...f, clientId: e.target.value, clientName: '' }))
                  }}
                  className={inp}
                  style={inpStyle}
                >
                  <option value="">Selecione o cliente</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>
                  ))}
                </select>
                {!form.clientId && (
                  <div className="mt-2">
                    <input
                      value={form.clientName}
                      onChange={e => set('clientName', e.target.value)}
                      placeholder="Ou digite o nome do cliente manualmente"
                      className={inp}
                      style={inpStyle}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className={labelCls}>Nome do Projeto *</label>
                <input value={form.projectName} onChange={e => set('projectName', e.target.value)} placeholder="Ex: Identidade Visual Completa" className={inp} style={inpStyle} />
              </div>

              <div>
                <label className={labelCls}>Serviços Inclusos</label>
                <textarea
                  value={form.services}
                  onChange={e => set('services', e.target.value)}
                  placeholder="Descreva os serviços que serão prestados..."
                  className={inp}
                  style={{ ...inpStyle, minHeight: 100, resize: 'vertical' }}
                />
              </div>

              <div>
                <label className={labelCls}>Duração do Contrato</label>
                <input value={form.duration} onChange={e => set('duration', e.target.value)} className={inp} style={inpStyle} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Nome/Razão Social</label>
                <input value={form.clientName} onChange={e => set('clientName', e.target.value)} className={inp} style={inpStyle} />
              </div>
              <div>
                <label className={labelCls}>Representante</label>
                <input value={form.clientRepresentative} onChange={e => set('clientRepresentative', e.target.value)} className={inp} style={inpStyle} />
              </div>
              <div>
                <label className={labelCls}>CPF/CNPJ</label>
                <input value={form.clientDocument} onChange={e => set('clientDocument', e.target.value)} placeholder="000.000.000-00" className={inp} style={inpStyle} />
              </div>
              <div>
                <label className={labelCls}>E-mail</label>
                <input value={form.clientEmail} onChange={e => set('clientEmail', e.target.value)} placeholder="email@cliente.com" className={inp} style={inpStyle} />
              </div>
              <div>
                <label className={labelCls}>Telefone/WhatsApp</label>
                <input value={form.clientPhone} onChange={e => set('clientPhone', e.target.value)} className={inp} style={inpStyle} />
              </div>
              <div>
                <label className={labelCls}>Endereço</label>
                <input value={form.clientAddress} onChange={e => set('clientAddress', e.target.value)} className={inp} style={inpStyle} />
              </div>
              <div>
                <label className={labelCls}>Número</label>
                <input value={form.clientAddressNumber} onChange={e => set('clientAddressNumber', e.target.value)} className={inp} style={inpStyle} />
              </div>
              <div>
                <label className={labelCls}>Bairro</label>
                <input value={form.clientNeighborhood} onChange={e => set('clientNeighborhood', e.target.value)} className={inp} style={inpStyle} />
              </div>
              <div>
                <label className={labelCls}>Cidade</label>
                <input value={form.clientCity} onChange={e => set('clientCity', e.target.value)} className={inp} style={inpStyle} />
              </div>
              <div>
                <label className={labelCls}>Estado</label>
                <input value={form.clientState} onChange={e => set('clientState', e.target.value)} placeholder="Ex: SP" className={inp} style={inpStyle} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Valor Total *</label>
                <input
                  value={form.totalValue}
                  onChange={e => set('totalValue', e.target.value)}
                  type="number" step="0.01" placeholder="R$ 5.000,00"
                  className={inp} style={inpStyle}
                />
              </div>
              <div>
                <label className={labelCls}>Desconto</label>
                <input
                  value={form.discount}
                  onChange={e => set('discount', e.target.value)}
                  type="number" step="0.01"
                  className={inp} style={inpStyle}
                />
              </div>
              <div>
                <label className={labelCls}>Valor Final</label>
                <input
                  value={form.finalValue}
                  readOnly
                  className={inp}
                  style={{ ...inpStyle, opacity: 0.6 }}
                  placeholder="Calculado automaticamente"
                />
              </div>
              <div>
                <label className={labelCls}>Parcelas</label>
                <input
                  value={form.installments}
                  onChange={e => set('installments', e.target.value)}
                  type="number" min="1"
                  className={inp} style={inpStyle}
                />
              </div>
              <div>
                <label className={labelCls}>Forma de Pagamento</label>
                <select value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)} className={inp} style={inpStyle}>
                  {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Condições de Pagamento</label>
                <input value={form.paymentConditions} onChange={e => set('paymentConditions', e.target.value)} className={inp} style={inpStyle} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-[#a8a296] hover:text-white transition-colors">Cancelar</button>
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="px-4 py-2.5 rounded-xl text-sm font-medium border text-[#a8a296] hover:text-white hover:border-[#6e6a60] transition-colors" style={{ borderColor: 'rgba(255,255,255,0.16)' }}>
                ‹ Voltar
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
                style={{ background: '#ef4444' }}
              >
                Próximo ›
              </button>
            ) : (
              <button
                onClick={generate}
                disabled={saving || !form.clientName.trim() || !form.projectName.trim()}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center gap-2"
                style={{ background: '#ef4444' }}
              >
                {saving ? 'Gerando...' : 'Gerar Contrato'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function ContratosPage() {
  const router = useRouter()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showModelos, setShowModelos] = useState(false)
  const [showNovo, setShowNovo] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadContracts = useCallback(async () => {
    try {
      const res = await fetch('/api/contratos')
      if (res.ok) {
        const data = await res.json()
        setContracts(Array.isArray(data) ? data : [])
      }
    } catch {
      setContracts([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadTemplates = useCallback(async () => {
    try {
      // Ensure default template exists
      await fetch('/api/contratos/modelos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ensure-default' }),
      })
      const res = await fetch('/api/contratos/modelos')
      if (res.ok) {
        const data = await res.json()
        setTemplates(Array.isArray(data) ? data : [])
      }
    } catch {
      setTemplates([])
    }
  }, [])

  useEffect(() => {
    loadContracts()
    loadTemplates()
  }, [loadContracts, loadTemplates])

  async function deleteContract(id: string) {
    if (!confirm('Deletar este contrato?')) return
    setDeletingId(id)
    try {
      await fetch(`/api/contratos/${id}`, { method: 'DELETE' })
      setContracts(cs => cs.filter(c => c.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Contratos</h1>
          <p className="text-[#a8a296] text-sm mt-0.5">{contracts.length} contrato{contracts.length !== 1 ? 's' : ''} gerado{contracts.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setShowModelos(true); loadTemplates() }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all"
            style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#a8a296' }}
          >
            ◻ Modelos
          </button>
          <button
            onClick={() => setShowNovo(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#ef4444' }}
          >
            + Novo Contrato
          </button>
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: '#161518', borderColor: 'rgba(255,255,255,0.1)' }}>
        {loading ? (
          <div className="py-16 text-center text-[#6e6a60]">
            <p className="text-lg">Carregando...</p>
          </div>
        ) : contracts.length === 0 ? (
          <div className="py-16 text-center text-[#6e6a60]">
            <p className="text-5xl mb-4">◻</p>
            <p className="text-lg mb-1">Nenhum contrato gerado</p>
            <p className="text-sm mb-4">Crie seu primeiro contrato com modelo personalizável</p>
            <button
              onClick={() => setShowNovo(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#ef4444' }}
            >
              Gerar Contrato
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                {['Projeto', 'Cliente', 'Valor', 'Data', ''].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-[#6e6a60] px-6 py-3 uppercase tracking-wide font-mono">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#1c1b1e' }}>
              {contracts.map(c => (
                <tr key={c.id} className="hover:bg-[#1c1b1e] transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-white">{c.projectName}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#a8a296]">{c.clientName}</td>
                  <td className="px-6 py-4 text-sm font-medium text-white">
                    {fmt(c.finalValue || c.totalValue)}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6e6a60]">
                    {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => router.push(`/admin/contratos/${c.id}`)}
                        className="text-xs text-red-400 hover:underline"
                      >
                        Visualizar
                      </button>
                      <button
                        onClick={() => deleteContract(c.id)}
                        disabled={deletingId === c.id}
                        className="text-xs text-[#6e6a60] hover:text-red-400 transition-colors"
                      >
                        {deletingId === c.id ? '...' : 'Deletar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {showModelos && (
        <ModelosModal
          onClose={() => setShowModelos(false)}
          templates={templates}
          loadTemplates={loadTemplates}
        />
      )}

      {showNovo && (
        <NovoContratoModal
          onClose={() => setShowNovo(false)}
          templates={templates}
          onCreated={(id) => {
            setShowNovo(false)
            router.push(`/admin/contratos/${id}`)
          }}
        />
      )}
    </div>
  )
}
