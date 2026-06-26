'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { nanoid } from 'nanoid'
import type { QuoteBuilderState, BuilderSection, BuilderItem } from '@/types'
import { calcItemTotal, calcQuoteTotal, formatCurrency, ITEM_TYPE_LABELS } from '@/lib/utils'

const SECTION_TYPE_LABELS = { TEXT: 'Texto', IMAGES: 'Imagens', TERMS: 'Termos e Condições' }

const PAYMENT_METHODS = ['Pix', 'Crédito', 'Débito', 'Dinheiro', 'Transferência', 'Boleto', 'Cheque']

const EMPTY_STATE: QuoteBuilderState = {
  title: '',
  serialNumber: true,
  client: null,
  sections: [],
  items: [],
  discount: 0,
  discountType: 'percent',
  notes: '',
  contractTerms: '',
  observations: '',
  validUntil: '',
  paymentMethods: [],
}

interface Props {
  initialState?: Partial<QuoteBuilderState>
  quoteId?: string
}

function makeDefaultSections(): BuilderSection[] {
  return [
    { id: nanoid(), type: 'TEXT', title: 'Relatório inicial', content: '', images: [], order: 0 },
    { id: nanoid(), type: 'TEXT', title: 'Descrição das atividades', content: '', images: [], order: 1 },
    { id: nanoid(), type: 'IMAGES', title: 'Imagens', content: '', images: [], order: 2 },
  ]
}

export function QuoteBuilder({ initialState, quoteId }: Props) {
  const router = useRouter()
  const [state, setState] = useState<QuoteBuilderState>({
    ...EMPTY_STATE,
    ...initialState,
    sections: initialState?.sections !== undefined ? initialState.sections : makeDefaultSections(),
  })
  const [saving, setSaving] = useState(false)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())
  const [clientOpen, setClientOpen] = useState(false)
  const [pricesOpen, setPricesOpen] = useState(true)
  const [configOpen, setConfigOpen] = useState(false)

  const update = useCallback(<K extends keyof QuoteBuilderState>(key: K, value: QuoteBuilderState[K]) => {
    setState(s => ({ ...s, [key]: value }))
  }, [])

  function toggleSection(id: string) {
    setOpenSections(s => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function addSection(type: BuilderSection['type']) {
    const section: BuilderSection = {
      id: nanoid(),
      type,
      title: SECTION_TYPE_LABELS[type],
      content: '',
      images: [],
      order: state.sections.length,
    }
    setState(s => ({ ...s, sections: [...s.sections, section] }))
    setOpenSections(o => new Set(o).add(section.id))
  }

  function updateSection(id: string, changes: Partial<BuilderSection>) {
    setState(s => ({
      ...s,
      sections: s.sections.map(sec => sec.id === id ? { ...sec, ...changes } : sec),
    }))
  }

  function removeSection(id: string) {
    setState(s => ({ ...s, sections: s.sections.filter(sec => sec.id !== id) }))
  }

  function addItem() {
    const item: BuilderItem = {
      id: nanoid(),
      name: '',
      description: '',
      type: 'SERVICE',
      quantity: 1,
      unit: '',
      price: 0,
      discount: 0,
      discountType: 'percent',
      order: state.items.length,
    }
    setState(s => ({ ...s, items: [...s.items, item] }))
  }

  function updateItem(id: string, changes: Partial<BuilderItem>) {
    setState(s => ({
      ...s,
      items: s.items.map(i => i.id === id ? { ...i, ...changes } : i),
    }))
  }

  function removeItem(id: string) {
    setState(s => ({ ...s, items: s.items.filter(i => i.id !== id) }))
  }

  async function handleUpload(sectionId: string, files: FileList) {
    const form = new FormData()
    Array.from(files).forEach(f => form.append('files', f))
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const { urls } = await res.json()
    const images = urls.map((url: string, i: number) => ({
      id: nanoid(), url, name: files[i]?.name ?? '', order: i,
    }))
    setState(s => ({
      ...s,
      sections: s.sections.map(sec =>
        sec.id === sectionId ? { ...sec, images: [...sec.images, ...images] } : sec
      ),
    }))
  }

  async function save(status?: string) {
    if (!state.title.trim()) { toast.error('Adicione um título ao orçamento'); return }
    setSaving(true)
    try {
      const body = { ...state, status }
      const url = quoteId ? `/api/orcamentos/${quoteId}` : '/api/orcamentos'
      const method = quoteId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      toast.success(quoteId ? 'Orçamento atualizado!' : 'Orçamento criado!')
      if (!quoteId) router.push(`/admin/orcamentos/${data.id}`)
    } catch (e) {
      toast.error('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const { subtotal, discountAmount, total } = calcQuoteTotal(state.items, state.discount, state.discountType)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col gap-3 px-4 md:px-8 py-3 md:py-5 border-b shrink-0" style={{ borderColor: '#2a2a2a', background: '#1a1a1a' }}>
        <input
          value={state.title}
          onChange={e => update('title', e.target.value)}
          placeholder="Título do orçamento..."
          className="w-full text-lg md:text-xl font-semibold bg-transparent text-white placeholder-[#444] focus:outline-none"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => save('DRAFT')}
            disabled={saving}
            className="flex-1 md:flex-none h-9 md:h-10 px-4 md:px-5 rounded-xl text-sm font-medium text-[#888] border border-[#333] hover:border-[#555] hover:text-white transition-all disabled:opacity-50"
          >
            Rascunho
          </button>
          <button
            onClick={() => save('SENT')}
            disabled={saving}
            className="flex-1 md:flex-none h-9 md:h-10 px-4 md:px-5 rounded-xl text-sm font-semibold text-[#1E1E1E] transition-opacity disabled:opacity-50"
            style={{ background: '#D5FF40' }}
          >
            {saving ? 'Salvando...' : 'Salvar e Enviar'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto py-8 px-4 flex flex-col gap-4">

          {/* Serial Number */}
          <div className="flex items-center gap-3 px-1">
            <button
              onClick={() => update('serialNumber', !state.serialNumber)}
              className={`relative w-10 h-6 rounded-full transition-colors ${state.serialNumber ? 'bg-[#D5FF40]' : 'bg-[#333]'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${state.serialNumber ? 'left-5' : 'left-1'}`} />
            </button>
            <span className="text-sm text-[#888]">Número serial</span>
          </div>

          {/* Client */}
          <Section
            title="Dados do Cliente"
            badge="opcional"
            open={clientOpen}
            onToggle={() => setClientOpen(o => !o)}
          >
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'name', label: 'Nome completo', placeholder: 'João Silva', full: true },
                { key: 'email', label: 'Email', placeholder: 'joao@empresa.com' },
                { key: 'phone', label: 'Telefone', placeholder: '(11) 99999-9999' },
                { key: 'company', label: 'Empresa', placeholder: 'Empresa Ltda' },
                { key: 'document', label: 'CPF / CNPJ', placeholder: '00.000.000/0001-00' },
                { key: 'address', label: 'Endereço', placeholder: 'Rua ...', full: true },
              ].map(f => (
                <div key={f.key} className={f.full ? 'col-span-2' : ''}>
                  <label className="block text-xs text-[#666] mb-1">{f.label}</label>
                  <input
                    value={(state.client as Record<string, string> | null)?.[f.key] ?? ''}
                    onChange={e => update('client', { ...{ name: '', email: '', phone: '', company: '', document: '', address: '' }, ...state.client, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full h-10 rounded-lg bg-[#2a2a2a] border border-[#333] px-3 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#D5FF40] transition-colors"
                  />
                </div>
              ))}
            </div>
          </Section>

          {/* Dynamic Sections */}
          {state.sections.map(sec => (
            <Section
              key={sec.id}
              title={sec.title}
              badge="opcional"
              open={openSections.has(sec.id)}
              onToggle={() => toggleSection(sec.id)}
              onRemove={() => removeSection(sec.id)}
              titleEditable
              onTitleChange={t => updateSection(sec.id, { title: t })}
            >
              {sec.type === 'TEXT' && (
                <textarea
                  value={sec.content}
                  onChange={e => updateSection(sec.id, { content: e.target.value })}
                  placeholder="Digite o conteúdo..."
                  rows={6}
                  className="w-full rounded-lg bg-[#2a2a2a] border border-[#333] p-3 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#D5FF40] resize-none transition-colors"
                />
              )}

              {sec.type === 'IMAGES' && (
                <div>
                  <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-[#333] cursor-pointer hover:border-[#D5FF40] hover:bg-[#D5FF40]/5 transition-all">
                    <span className="text-2xl mb-1">🖼</span>
                    <span className="text-sm text-[#666]">Clique para adicionar imagens</span>
                    <input type="file" accept="image/*" multiple className="hidden"
                      onChange={e => e.target.files && handleUpload(sec.id, e.target.files)} />
                  </label>
                  {sec.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {sec.images.map(img => (
                        <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden bg-[#2a2a2a]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                          <button
                            onClick={() => updateSection(sec.id, { images: sec.images.filter(i => i.id !== img.id) })}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {sec.type === 'TERMS' && (
                <textarea
                  value={sec.content}
                  onChange={e => updateSection(sec.id, { content: e.target.value })}
                  placeholder="Termos e condições do contrato..."
                  rows={8}
                  className="w-full rounded-lg bg-[#2a2a2a] border border-[#333] p-3 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#D5FF40] resize-none transition-colors"
                />
              )}
            </Section>
          ))}

          {/* Add Section */}
          <div className="flex gap-2">
            {(['TEXT', 'IMAGES', 'TERMS'] as const).map(type => (
              <button
                key={type}
                onClick={() => addSection(type)}
                className="flex-1 py-2 text-xs font-medium text-[#666] border border-dashed border-[#333] rounded-xl hover:border-[#D5FF40] hover:text-[#D5FF40] transition-all"
              >
                + {SECTION_TYPE_LABELS[type]}
              </button>
            ))}
          </div>

          {/* Prices */}
          <Section
            title="Preços"
            badge="opcional"
            open={pricesOpen}
            onToggle={() => setPricesOpen(o => !o)}
          >
            <div className="flex flex-col gap-3">
              {state.items.length > 0 && (
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#333' }}>
                  {/* Header */}
                  <div className="grid grid-cols-[1fr_80px_140px_100px_100px_32px] gap-2 px-4 py-2 text-xs text-[#555] uppercase bg-[#2a2a2a]">
                    <span>Item</span><span>Qtd</span><span>Tipo</span><span>Valor</span><span className="text-right">Total</span><span />
                  </div>

                  {state.items.map((item, idx) => (
                    <div key={item.id} className="border-t" style={{ borderColor: '#2a2a2a' }}>
                      <div className="grid grid-cols-[1fr_80px_140px_100px_100px_32px] gap-2 px-4 py-3 items-center">
                        <input
                          value={item.name}
                          onChange={e => updateItem(item.id, { name: e.target.value })}
                          placeholder={`Item #${idx + 1}`}
                          className="bg-transparent text-sm text-white placeholder-[#444] focus:outline-none"
                        />
                        <input
                          type="number"
                          value={item.quantity}
                          min={0}
                          onChange={e => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-[#2a2a2a] border border-[#333] rounded-lg px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-[#D5FF40]"
                        />
                        <select
                          value={item.type}
                          onChange={e => updateItem(item.id, { type: e.target.value as BuilderItem['type'] })}
                          className="bg-[#2a2a2a] border border-[#333] rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-[#D5FF40]"
                        >
                          {Object.entries(ITEM_TYPE_LABELS).map(([v, l]) => (
                            <option key={v} value={v}>{l}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={item.price}
                          min={0}
                          step={0.01}
                          onChange={e => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-[#2a2a2a] border border-[#333] rounded-lg px-2 py-1 text-sm text-white text-right focus:outline-none focus:border-[#D5FF40]"
                        />
                        <p className="text-sm text-right font-medium text-white">
                          {formatCurrency(calcItemTotal(item))}
                        </p>
                        <button onClick={() => removeItem(item.id)} className="text-[#555] hover:text-red-400 transition-colors text-lg leading-none">×</button>
                      </div>

                      {/* Description */}
                      <div className="px-4 pb-3">
                        <input
                          value={item.description}
                          onChange={e => updateItem(item.id, { description: e.target.value })}
                          placeholder="Descrição opcional..."
                          className="w-full bg-transparent text-xs text-[#666] placeholder-[#444] focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={addItem}
                className="flex items-center gap-2 text-sm text-[#D5FF40] hover:opacity-80 transition-opacity"
              >
                + Adicionar item
              </button>

              {/* Discount */}
              {state.items.length > 0 && (
                <>
                  <div className="flex items-center gap-3 mt-2">
                    <label className="text-sm text-[#888]">Desconto</label>
                    <select
                      value={state.discountType}
                      onChange={e => update('discountType', e.target.value as 'percent' | 'fixed')}
                      className="bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#D5FF40]"
                    >
                      <option value="percent">%</option>
                      <option value="fixed">R$</option>
                    </select>
                    <input
                      type="number"
                      value={state.discount}
                      min={0}
                      onChange={e => update('discount', parseFloat(e.target.value) || 0)}
                      className="w-28 bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#D5FF40]"
                    />
                  </div>

                  {/* Totals */}
                  <div className="rounded-xl bg-[#2a2a2a] border border-[#333] divide-y mt-2" style={{ borderColor: '#333' }}>
                    <div className="flex justify-between px-4 py-3 text-sm text-[#888]">
                      <span>Subtotal</span><span className="text-white">{formatCurrency(subtotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between px-4 py-3 text-sm text-red-400">
                        <span>Desconto</span><span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between px-4 py-3 text-base font-bold">
                      <span className="text-white">Total</span>
                      <span style={{ color: '#D5FF40' }}>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Section>

          {/* Payment Methods */}
          <Section title="Métodos de pagamento" open={true} onToggle={() => {}}>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map(m => {
                const active = state.paymentMethods.includes(m)
                return (
                  <button
                    key={m}
                    onClick={() => update('paymentMethods', active ? state.paymentMethods.filter(x => x !== m) : [...state.paymentMethods, m])}
                    className="px-4 py-2 rounded-xl text-sm font-medium border transition-all"
                    style={{
                      background: active ? '#D5FF4022' : '#2a2a2a',
                      borderColor: active ? '#D5FF40' : '#333',
                      color: active ? '#D5FF40' : '#888',
                    }}
                  >
                    {m}
                  </button>
                )
              })}
            </div>
          </Section>

          {/* Contract Terms */}
          <Section title="Condições de contrato" open={true} onToggle={() => {}}>
            <textarea
              value={state.contractTerms}
              onChange={e => update('contractTerms', e.target.value)}
              placeholder="Descreva as condições e termos do contrato..."
              rows={6}
              className="w-full rounded-lg bg-[#2a2a2a] border border-[#333] p-3 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#D5FF40] resize-none transition-colors"
            />
          </Section>

          {/* Observations */}
          <Section title="Observações" open={true} onToggle={() => {}}>
            <textarea
              value={state.observations}
              onChange={e => update('observations', e.target.value)}
              placeholder="Observações adicionais para o cliente..."
              rows={4}
              className="w-full rounded-lg bg-[#2a2a2a] border border-[#333] p-3 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#D5FF40] resize-none transition-colors"
            />
          </Section>

          {/* Validity + Notes */}
          <Section title="Configurações" open={configOpen} onToggle={() => setConfigOpen(o => !o)}>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-[#666] mb-1 block">Validade do orçamento</label>
                <input
                  type="date"
                  value={state.validUntil}
                  onChange={e => update('validUntil', e.target.value)}
                  className="h-10 rounded-lg bg-[#2a2a2a] border border-[#333] px-3 text-sm text-white focus:outline-none focus:border-[#D5FF40]"
                />
              </div>
              <div>
                <label className="text-xs text-[#666] mb-1 block">Observações internas</label>
                <textarea
                  value={state.notes}
                  onChange={e => update('notes', e.target.value)}
                  rows={3}
                  placeholder="Notas que não aparecem no orçamento..."
                  className="w-full rounded-lg bg-[#2a2a2a] border border-[#333] p-3 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#D5FF40] resize-none"
                />
              </div>
            </div>
          </Section>

        </div>
      </div>
    </div>
  )
}

/* ─── Sub-components ─── */

function Section({
  title, badge, open, onToggle, onRemove, children, titleEditable, onTitleChange,
}: {
  title: string
  badge?: string
  open: boolean
  onToggle: () => void
  onRemove?: () => void
  children: React.ReactNode
  titleEditable?: boolean
  onTitleChange?: (t: string) => void
}) {
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: '#252525', borderColor: '#333' }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#2a2a2a] transition-colors"
      >
        <div className="flex items-center gap-2">
          {titleEditable && onTitleChange ? (
            <input
              value={title}
              onChange={e => { e.stopPropagation(); onTitleChange(e.target.value) }}
              onClick={e => e.stopPropagation()}
              className="bg-transparent text-sm font-medium text-white focus:outline-none"
            />
          ) : (
            <span className="text-sm font-medium text-white">{title}</span>
          )}
          {badge && <span className="text-xs text-[#555]">({badge})</span>}
        </div>
        <div className="flex items-center gap-2">
          {onRemove && (
            <span
              onClick={e => { e.stopPropagation(); onRemove() }}
              className="text-[#555] hover:text-red-400 transition-colors px-1"
            >×</span>
          )}
          <span className="text-[#555] text-sm">{open ? '∧' : '∨'}</span>
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t" style={{ borderColor: '#2a2a2a' }}>
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  )
}
