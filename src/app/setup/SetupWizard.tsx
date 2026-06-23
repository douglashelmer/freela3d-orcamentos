'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const NICHES = [
  { value: 'modelagem3d', label: 'Modelagem 3D', icon: '🎭' },
  { value: 'motion', label: 'Motion Graphics', icon: '🎬' },
  { value: 'arq', label: 'Visualização Arquitetural', icon: '🏗️' },
  { value: 'game', label: 'Game Art', icon: '🎮' },
  { value: 'vfx', label: 'VFX / Composição', icon: '✨' },
  { value: 'animacao', label: 'Animação 3D', icon: '🤸' },
  { value: 'impressao', label: 'Impressão 3D', icon: '🖨️' },
  { value: 'produto', label: 'Design de Produto', icon: '📦' },
]

type ServiceSuggestion = { name: string; category: string; price: number }

const SERVICES_BY_NICHE: Record<string, ServiceSuggestion[]> = {
  modelagem3d: [
    { name: 'Modelagem de Personagem', category: 'Modelagem 3D', price: 1200 },
    { name: 'Modelagem de Produto', category: 'Modelagem 3D', price: 800 },
    { name: 'Low Poly / Estilizado', category: 'Modelagem 3D', price: 600 },
    { name: 'Modelagem Arquitetural', category: 'Modelagem 3D', price: 1500 },
    { name: 'Retopologia', category: 'Modelagem 3D', price: 500 },
    { name: 'Texturização', category: 'Modelagem 3D', price: 700 },
    { name: 'Rigging', category: 'Modelagem 3D', price: 900 },
    { name: 'Pacote Completo (Modelo + Tex + Rig)', category: 'Modelagem 3D', price: 2500 },
  ],
  motion: [
    { name: 'Intro Animada', category: 'Motion Graphics', price: 600 },
    { name: 'Vídeo Institucional', category: 'Motion Graphics', price: 2000 },
    { name: 'Animação de Logo', category: 'Motion Graphics', price: 400 },
    { name: 'Explainer Video', category: 'Motion Graphics', price: 3000 },
    { name: 'Post Animado (Redes Sociais)', category: 'Motion Graphics', price: 300 },
    { name: 'Transições Personalizadas', category: 'Motion Graphics', price: 800 },
  ],
  arq: [
    { name: 'Renderização Externa', category: 'Visualização Arquitetural', price: 800 },
    { name: 'Renderização Interna', category: 'Visualização Arquitetural', price: 700 },
    { name: 'Tour Virtual 360°', category: 'Visualização Arquitetural', price: 2500 },
    { name: 'Planta 3D', category: 'Visualização Arquitetural', price: 600 },
    { name: 'Vídeo Walkthrough', category: 'Visualização Arquitetural', price: 3000 },
    { name: 'Pacote Residencial (5 renders)', category: 'Visualização Arquitetural', price: 3500 },
  ],
  game: [
    { name: 'Asset de Ambiente', category: 'Game Art', price: 500 },
    { name: 'Personagem Jogável', category: 'Game Art', price: 2000 },
    { name: 'Concept Art 3D', category: 'Game Art', price: 800 },
    { name: 'Otimização de Assets', category: 'Game Art', price: 400 },
    { name: 'Set de Props', category: 'Game Art', price: 1200 },
    { name: 'Cenário Completo', category: 'Game Art', price: 3000 },
  ],
  vfx: [
    { name: 'Composição VFX', category: 'VFX', price: 1500 },
    { name: 'Simulação de Partículas', category: 'VFX', price: 2000 },
    { name: 'Simulação de Fluidos', category: 'VFX', price: 2500 },
    { name: 'Extensão de Fundo', category: 'VFX', price: 800 },
    { name: 'Integração 3D/Live Action', category: 'VFX', price: 3000 },
  ],
  animacao: [
    { name: 'Animação de Personagem (cena)', category: 'Animação 3D', price: 1500 },
    { name: 'Animação de Produto', category: 'Animação 3D', price: 1000 },
    { name: 'Ciclo de Caminhada', category: 'Animação 3D', price: 600 },
    { name: 'Animação Facial', category: 'Animação 3D', price: 900 },
    { name: 'Curta Animado (até 30s)', category: 'Animação 3D', price: 4000 },
  ],
  impressao: [
    { name: 'Prep. de Arquivo p/ Impressão', category: 'Impressão 3D', price: 200 },
    { name: 'Modelagem p/ Impressão 3D', category: 'Impressão 3D', price: 600 },
    { name: 'Reparo de Malha', category: 'Impressão 3D', price: 300 },
    { name: 'Miniaturas / Esculturas', category: 'Impressão 3D', price: 800 },
  ],
  produto: [
    { name: 'Modelagem de Produto', category: 'Design de Produto', price: 1000 },
    { name: 'Render de Produto (e-commerce)', category: 'Design de Produto', price: 600 },
    { name: 'Prototipagem Digital', category: 'Design de Produto', price: 1500 },
    { name: 'Animação de Produto (360°)', category: 'Design de Produto', price: 1200 },
    { name: 'Pacote Fotorrealismo (5 ângulos)', category: 'Design de Produto', price: 2500 },
  ],
}

const TOTAL_STEPS = 5

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

type WizardData = {
  name: string
  company: string
  phone: string
  monthlyGoal: string
  zipCode: string
  address: string
  neighborhood: string
  city: string
  state: string
  logoFile: File | null
  logoPreview: string | null
  specialty: string
  selectedServices: Set<number>
  customName: string
  customCategory: string
  customPrice: string
}

export default function SetupWizard({ userId, initialName }: { userId: string; initialName: string }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [customServices, setCustomServices] = useState<ServiceSuggestion[]>([])

  const [data, setData] = useState<WizardData>({
    name: initialName,
    company: '',
    phone: '',
    monthlyGoal: '',
    zipCode: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    logoFile: null,
    logoPreview: null,
    specialty: '',
    selectedServices: new Set(),
    customName: '',
    customCategory: '',
    customPrice: '',
  })

  const set = (key: keyof WizardData, value: unknown) =>
    setData(prev => ({ ...prev, [key]: value }))

  const progress = ((step - 1) / TOTAL_STEPS) * 100

  async function lookupCep(cep: string) {
    const clean = cep.replace(/\D/g, '')
    if (clean.length !== 8) return
    setCepLoading(true)
    try {
      const res = await fetch(`/api/cep/${clean}`)
      if (res.ok) {
        const d = await res.json()
        setData(prev => ({
          ...prev,
          address: d.address || prev.address,
          neighborhood: d.neighborhood || prev.neighborhood,
          city: d.city || prev.city,
          state: d.state || prev.state,
        }))
      }
    } finally {
      setCepLoading(false)
    }
  }

  function toggleService(index: number) {
    setData(prev => {
      const next = new Set(prev.selectedServices)
      next.has(index) ? next.delete(index) : next.add(index)
      return { ...prev, selectedServices: next }
    })
  }

  function addCustomService() {
    if (!data.customName || !data.customPrice) return
    setCustomServices(prev => [
      ...prev,
      {
        name: data.customName,
        category: data.customCategory || 'Geral',
        price: parseFloat(data.customPrice.replace(',', '.')),
      },
    ])
    setData(prev => ({ ...prev, customName: '', customCategory: '', customPrice: '' }))
  }

  function removeCustom(i: number) {
    setCustomServices(prev => prev.filter((_, idx) => idx !== i))
  }

  async function finish() {
    setSaving(true)
    try {
      let logoUrl: string | null = null
      if (data.logoFile) {
        const form = new FormData()
        form.append('files', data.logoFile)
        const res = await fetch('/api/upload', { method: 'POST', body: form })
        const json = await res.json()
        logoUrl = json.urls?.[0] ?? null
      }

      await fetch('/api/usuario/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          company: data.company,
          phone: data.phone,
          monthlyGoal: data.monthlyGoal || null,
          zipCode: data.zipCode,
          address: data.address,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          logo: logoUrl,
          specialty: data.specialty,
          onboardingCompleted: true,
        }),
      })

      const suggestions = SERVICES_BY_NICHE[data.specialty] ?? []
      const toSave: ServiceSuggestion[] = [
        ...Array.from(data.selectedServices).map(i => suggestions[i]),
        ...customServices,
      ].filter(Boolean)

      if (toSave.length > 0) {
        await fetch('/api/servicos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toSave),
        })
      }

      router.push('/admin')
    } catch (e) {
      console.error(e)
      setSaving(false)
    }
  }

  async function skip() {
    await fetch('/api/usuario/perfil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ onboardingCompleted: true }),
    })
    router.push('/admin')
  }

  const inputCls =
    'w-full px-4 py-3 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#D5FF40] transition-all'
  const inputStyle = { background: '#252525', border: '1px solid #333' }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1E1E1E' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-8 py-4 border-b"
        style={{ borderColor: '#2a2a2a' }}
      >
        <Image src="/logo.svg" alt="Freela3D" width={130} height={32} />
        <button onClick={skip} className="text-sm text-[#666] hover:text-white transition-colors">
          Pular configuração →
        </button>
      </div>

      {/* Progress */}
      <div className="px-8 pt-6 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-3">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: i + 1 < step ? '#D5FF40' : i + 1 === step ? '#D5FF40' : '#252525',
                  color: i + 1 <= step ? '#1E1E1E' : '#666',
                  border: i + 1 > step ? '2px solid #333' : 'none',
                }}
              >
                {i + 1 < step ? '✓' : i + 1}
              </div>
            ))}
          </div>
          <span className="text-xs text-[#666]">{Math.round(progress)}% completo</span>
        </div>
        <div className="h-1 rounded-full" style={{ background: '#252525' }}>
          <div
            className="h-1 rounded-full transition-all"
            style={{ background: '#D5FF40', width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          {/* ── STEP 1: Dados pessoais ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Dados da sua empresa</h2>
                <p className="text-[#888] text-sm mt-1">Essas informações aparecem nos seus orçamentos</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#888] mb-1.5 uppercase tracking-wide">
                    Nome completo *
                  </label>
                  <input
                    className={inputCls}
                    style={inputStyle}
                    value={data.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#888] mb-1.5 uppercase tracking-wide">
                    Nome da empresa / estúdio
                  </label>
                  <input
                    className={inputCls}
                    style={inputStyle}
                    value={data.company}
                    onChange={e => set('company', e.target.value)}
                    placeholder="Ex: Studio Vertex"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#888] mb-1.5 uppercase tracking-wide">
                    Telefone / WhatsApp
                  </label>
                  <input
                    className={inputCls}
                    style={inputStyle}
                    value={data.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#888] mb-1.5 uppercase tracking-wide">
                    Meta de faturamento mensal
                  </label>
                  <input
                    className={inputCls}
                    style={inputStyle}
                    value={data.monthlyGoal}
                    onChange={e => set('monthlyGoal', e.target.value)}
                    placeholder="Ex: 10000"
                    type="number"
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Endereço ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Sua localização</h2>
                <p className="text-[#888] text-sm mt-1">Opcional — aparece no rodapé dos orçamentos</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#888] mb-1.5 uppercase tracking-wide">
                    CEP
                  </label>
                  <div className="flex gap-2">
                    <input
                      className={inputCls}
                      style={inputStyle}
                      value={data.zipCode}
                      onChange={e => set('zipCode', e.target.value)}
                      onBlur={e => lookupCep(e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    {cepLoading && (
                      <div className="flex items-center px-3 text-[#666] text-sm">Buscando…</div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#888] mb-1.5 uppercase tracking-wide">
                    Endereço
                  </label>
                  <input
                    className={inputCls}
                    style={inputStyle}
                    value={data.address}
                    onChange={e => set('address', e.target.value)}
                    placeholder="Rua, Av…"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#888] mb-1.5 uppercase tracking-wide">
                    Bairro
                  </label>
                  <input
                    className={inputCls}
                    style={inputStyle}
                    value={data.neighborhood}
                    onChange={e => set('neighborhood', e.target.value)}
                    placeholder="Bairro"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-[#888] mb-1.5 uppercase tracking-wide">
                      Cidade
                    </label>
                    <input
                      className={inputCls}
                      style={inputStyle}
                      value={data.city}
                      onChange={e => set('city', e.target.value)}
                      placeholder="Cidade"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#888] mb-1.5 uppercase tracking-wide">
                      Estado
                    </label>
                    <input
                      className={inputCls}
                      style={inputStyle}
                      value={data.state}
                      onChange={e => set('state', e.target.value)}
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Logo ── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Logo do seu estúdio</h2>
                <p className="text-[#888] text-sm mt-1">
                  Opcional — aparece nos orçamentos e no painel
                </p>
              </div>
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0] ?? null
                    if (!file) return
                    set('logoFile', file)
                    const reader = new FileReader()
                    reader.onload = ev => set('logoPreview', ev.target?.result as string)
                    reader.readAsDataURL(file)
                  }}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-12 gap-4 transition-all hover:border-[#D5FF40]"
                  style={{ borderColor: data.logoPreview ? '#D5FF40' : '#333' }}
                >
                  {data.logoPreview ? (
                    <img
                      src={data.logoPreview}
                      alt="Preview"
                      className="max-h-24 max-w-[200px] object-contain"
                    />
                  ) : (
                    <>
                      <div className="text-4xl">🖼️</div>
                      <div className="text-center">
                        <p className="text-white font-medium">Clique para fazer upload</p>
                        <p className="text-[#666] text-xs mt-1">PNG, JPG, SVG até 5MB</p>
                      </div>
                    </>
                  )}
                </button>
                {data.logoPreview && (
                  <button
                    onClick={() => setData(prev => ({ ...prev, logoFile: null, logoPreview: null }))}
                    className="mt-3 text-xs text-[#666] hover:text-red-400 transition-colors"
                  >
                    Remover logo
                  </button>
                )}
                <p className="mt-3 text-xs text-[#555]">
                  💡 Use PNG com fundo transparente para melhor resultado
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 4: Especialidade ── */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Sua especialidade</h2>
                <p className="text-[#888] text-sm mt-1">
                  Vamos sugerir serviços e preços com base no seu nicho
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {NICHES.map(n => (
                  <button
                    key={n.value}
                    onClick={() => set('specialty', n.value)}
                    className="flex items-center gap-3 px-4 py-4 rounded-xl text-left transition-all"
                    style={{
                      background: data.specialty === n.value ? '#D5FF4022' : '#252525',
                      border: `2px solid ${data.specialty === n.value ? '#D5FF40' : '#333'}`,
                    }}
                  >
                    <span className="text-2xl">{n.icon}</span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: data.specialty === n.value ? '#D5FF40' : '#ccc' }}
                    >
                      {n.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 5: Serviços ── */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Seus serviços e preços</h2>
                <p className="text-[#888] text-sm mt-1">
                  Selecione os que você oferece — você pode editar depois
                </p>
              </div>

              {data.specialty && (
                <div className="grid grid-cols-1 gap-2">
                  {(SERVICES_BY_NICHE[data.specialty] ?? []).map((s, i) => {
                    const selected = data.selectedServices.has(i)
                    return (
                      <button
                        key={i}
                        onClick={() => toggleService(i)}
                        className="flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all"
                        style={{
                          background: selected ? '#D5FF4015' : '#252525',
                          border: `1.5px solid ${selected ? '#D5FF40' : '#333'}`,
                        }}
                      >
                        <div>
                          <p
                            className="text-sm font-medium"
                            style={{ color: selected ? '#D5FF40' : '#fff' }}
                          >
                            {s.name}
                          </p>
                          <p className="text-xs text-[#666]">{s.category}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-[#D5FF40]">
                            {formatBRL(s.price)}
                          </span>
                          <div
                            className="w-5 h-5 rounded flex items-center justify-center text-xs"
                            style={{
                              background: selected ? '#D5FF40' : '#333',
                              color: selected ? '#1E1E1E' : '#666',
                            }}
                          >
                            {selected ? '✓' : '+'}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Custom services */}
              <div>
                <p className="text-xs font-medium text-[#888] uppercase tracking-wide mb-3">
                  Adicionar serviço personalizado
                </p>
                <div className="rounded-xl p-4 space-y-3" style={{ background: '#252525', border: '1px solid #333' }}>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      className={inputCls}
                      style={{ background: '#1E1E1E', border: '1px solid #333' }}
                      placeholder="Nome do serviço"
                      value={data.customName}
                      onChange={e => set('customName', e.target.value)}
                    />
                    <input
                      className={inputCls}
                      style={{ background: '#1E1E1E', border: '1px solid #333' }}
                      placeholder="Preço (R$)"
                      value={data.customPrice}
                      onChange={e => set('customPrice', e.target.value)}
                      type="number"
                      min="0"
                    />
                  </div>
                  <div className="flex gap-3">
                    <input
                      className={`${inputCls} flex-1`}
                      style={{ background: '#1E1E1E', border: '1px solid #333' }}
                      placeholder="Categoria (ex: Render)"
                      value={data.customCategory}
                      onChange={e => set('customCategory', e.target.value)}
                    />
                    <button
                      onClick={addCustomService}
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-[#1E1E1E] transition-opacity hover:opacity-80"
                      style={{ background: '#D5FF40' }}
                    >
                      + Adicionar
                    </button>
                  </div>
                </div>

                {customServices.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {customServices.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-4 py-2 rounded-xl"
                        style={{ background: '#252525', border: '1px solid #333' }}
                      >
                        <div>
                          <p className="text-sm text-white">{s.name}</p>
                          <p className="text-xs text-[#666]">{s.category}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-[#D5FF40]">
                            {formatBRL(s.price)}
                          </span>
                          <button
                            onClick={() => removeCustom(i)}
                            className="text-[#555] hover:text-red-400 transition-colors text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => step > 1 && setStep(s => s - 1)}
              className="px-6 py-3 rounded-xl text-sm font-medium transition-colors"
              style={{ color: step === 1 ? '#444' : '#888' }}
              disabled={step === 1}
            >
              ← Voltar
            </button>

            {step < TOTAL_STEPS ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="px-8 py-3 rounded-xl text-sm font-bold text-[#1E1E1E] transition-opacity hover:opacity-90"
                style={{ background: '#D5FF40' }}
              >
                Próximo →
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={saving}
                className="px-8 py-3 rounded-xl text-sm font-bold text-[#1E1E1E] transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: '#D5FF40' }}
              >
                {saving ? 'Salvando…' : 'Concluir ✓'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
