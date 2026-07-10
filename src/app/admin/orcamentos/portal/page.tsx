'use client'

import { useState, useEffect, useRef } from 'react'

type PortalSettings = {
  logo: string | null
  favicon: string | null
  primaryColor: string
  secondaryColor: string
}

const DEFAULT: PortalSettings = {
  logo: null,
  favicon: null,
  primaryColor: '#e8b84b',
  secondaryColor: '#a3e635',
}

const PALETTES = [
  { name: 'Sunset Glow', desc: 'Vibrante e energético', primary: '#FF6B35', secondary: '#FFD166' },
  { name: 'Ocean Breeze', desc: 'Fresco e profissional', primary: '#22D3EE', secondary: '#64748B' },
  { name: 'Purple Haze', desc: 'Moderno e ousado', primary: '#06B6D4', secondary: '#EC4899' },
  { name: 'Cyber Night', desc: 'Tech e futurista', primary: '#8B5CF6', secondary: '#F43F5E' },
  { name: 'Forest Dream', desc: 'Natural e confiável', primary: '#10B981', secondary: '#059669' },
  { name: 'Rose Gold', desc: 'Elegante e premium', primary: '#F43F5E', secondary: '#F59E0B' },
  { name: 'Electric Blue', desc: 'Inovador e dinâmico', primary: '#3B82F6', secondary: '#8B5CF6' },
  { name: 'Fire & Ice', desc: 'Contraste impactante', primary: '#EF4444', secondary: '#06B6D4' },
]

function ImageUpload({
  label, hint, size, value, onChange,
}: {
  label: string; hint: string; size: string; value: string | null; onChange: (v: string | null) => void
}) {
  const ref = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = e => onChange(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-[#a8a296]">{label}</p>
        <span className="text-xs text-[#6e6a60]">{size}</span>
      </div>
      <p className="text-xs text-[#6e6a60] mb-2">{hint}</p>
      <div
        className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-6 cursor-pointer hover:border-[#6e6a60] transition-colors relative"
        style={{ borderColor: 'rgba(255,255,255,0.1)' }}
        onClick={() => ref.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="max-h-16 object-contain" />
        ) : (
          <>
            <span className="text-2xl text-[rgba(255,255,255,0.16)] mb-2">🖼</span>
            <p className="text-sm text-[#6e6a60]">Clique para fazer upload</p>
            <p className="text-xs text-[rgba(255,255,255,0.16)] mt-1">PNG, JPG até 5MB</p>
          </>
        )}
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>
      {value && (
        <button onClick={() => onChange(null)} className="text-xs text-[#6e6a60] hover:text-red-400 mt-1 transition-colors">
          Remover imagem
        </button>
      )}
    </div>
  )
}

function PortalPreview({ s }: { s: PortalSettings }) {
  const grad = `linear-gradient(135deg, ${s.primaryColor}, ${s.secondaryColor})`

  return (
    <div className="rounded-2xl overflow-hidden border" style={{ background: '#0f0f11', borderColor: '#1c1b1e', fontFamily: 'sans-serif' }}>
      {/* Mini header */}
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ background: '#0f0f11', borderColor: '#1c1b1e' }}>
        {s.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.logo} alt="" className="h-6 object-contain max-w-[100px]" />
        ) : (
          <span className="text-sm font-bold text-white">Freela3D</span>
        )}
        <span className="text-xs" style={{ color: s.primaryColor }}>#2024-001</span>
      </div>

      <div className="p-4">
        {/* Badge */}
        <div className="flex justify-center mb-3">
          <span className="text-xs px-3 py-1 rounded-full font-semibold text-white" style={{ background: grad }}>
            ✦ Proposta Comercial
          </span>
        </div>

        {/* Title */}
        <h3 className="text-center text-sm font-bold text-white mb-0.5">Proposta de Design de Identidade Visual</h3>
        <p className="text-center text-xs mb-4" style={{ color: '#6e6a60' }}>Orçamento #2024-001</p>

        {/* Card */}
        <div className="rounded-xl border p-3 mb-3" style={{ background: '#0f0f11', borderColor: '#1c1b1e' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-white">Detalhes da Proposta</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#1c1b1e', color: '#a8a296' }}>Pendente</span>
          </div>
          <p className="text-xs font-medium text-white mb-2">Serviços Incluídos</p>
          {[
            { name: 'Criação de Logotipo', price: 'R$ 1.500,00' },
            { name: 'Manual de Marca', price: 'R$ 800,00' },
            { name: 'Papelaria', price: 'R$ 500,00' },
          ].map(item => (
            <div key={item.name} className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: '#1c1b1e' }}>
              <span className="text-xs text-[#a8a296]">{item.name}</span>
              <span className="text-xs font-semibold" style={{ color: s.primaryColor }}>{item.price}</span>
            </div>
          ))}
          <div className="mt-2 pt-2 space-y-1">
            <div className="flex justify-between text-xs"><span style={{ color: '#6e6a60' }}>Subtotal:</span><span className="text-white">R$ 2.800,00</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6e6a60' }}>Desconto:</span><span className="text-red-400">- R$ 300,00</span></div>
            <div className="flex justify-between text-sm font-bold mt-1"><span className="text-white">Total:</span><span style={{ color: s.primaryColor }}>R$ 2.500,00</span></div>
          </div>
        </div>

        {/* Button */}
        <button
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: grad }}
        >
          ✓ Aprovar Proposta
        </button>
      </div>
    </div>
  )
}

export default function PortalSettingsPage() {
  const [settings, setSettings] = useState<PortalSettings>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/portal-settings').then(r => r.json()).then(d => {
      setSettings({ ...DEFAULT, ...d })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function set<K extends keyof PortalSettings>(k: K, v: PortalSettings[K]) {
    setSaved(false)
    setSettings(s => ({ ...s, [k]: v }))
  }

  function applyPalette(p: typeof PALETTES[0]) {
    setSaved(false)
    setSettings(s => ({ ...s, primaryColor: p.primary, secondaryColor: p.secondary }))
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/portal-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500) }
      else alert('Erro ao salvar. Rode migration_v12.sql no DbGate.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-[#6e6a60] text-sm">Carregando...</div>

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Personalizar Página de Orçamentos</h1>
          <p className="text-[#a8a296] text-sm mt-0.5">Customize a aparência da página que seus clientes veem</p>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Left: settings */}
        <div className="w-[460px] shrink-0 flex flex-col gap-0">
          <div className="rounded-2xl border overflow-hidden" style={{ background: '#161518', borderColor: 'rgba(255,255,255,0.1)' }}>

            {/* Logo e Cores */}
            <div className="px-6 py-5">
              <p className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <span style={{ color: '#ef4444' }}>◈</span> Logo e Cores
              </p>

              <ImageUpload
                label="Logo (opcional)"
                hint="Logo da Página de Orçamento"
                size="500x200px"
                value={settings.logo}
                onChange={v => set('logo', v)}
              />

              <ImageUpload
                label="Favicon (opcional)"
                hint="Ícone que aparece na aba do navegador. Recomendado: imagem quadrada PNG."
                size="64x64px"
                value={settings.favicon}
                onChange={v => set('favicon', v)}
              />

              {/* Palettes */}
              <div className="mt-2">
                <p className="text-sm text-[#a8a296] mb-3">Paletas de Cores Sugeridas</p>
                <div className="grid grid-cols-2 gap-3">
                  {PALETTES.map(p => (
                    <button
                      key={p.name}
                      onClick={() => applyPalette(p)}
                      className="rounded-xl border text-left overflow-hidden transition-all hover:border-[#6e6a60]"
                      style={{
                        borderColor: settings.primaryColor === p.primary && settings.secondaryColor === p.secondary ? '#ef4444' : 'rgba(255,255,255,0.1)',
                        background: '#09090a',
                      }}
                    >
                      <div className="flex h-10 overflow-hidden">
                        <div className="flex-1" style={{ background: p.primary }} />
                        <div className="flex-1" style={{ background: p.secondary }} />
                      </div>
                      <div className="px-2.5 py-2">
                        <p className="text-xs font-semibold text-white">{p.name}</p>
                        <p className="text-[11px]" style={{ color: '#6e6a60' }}>{p.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom colors */}
              <div className="mt-5">
                <p className="text-sm text-[#a8a296] mb-3">Personalizar Cores</p>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs text-[#6e6a60] block mb-1">Cor Primária</label>
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border" style={{ background: '#09090a', borderColor: 'rgba(255,255,255,0.1)' }}>
                      <input type="color" value={settings.primaryColor} onChange={e => set('primaryColor', e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0" />
                      <span className="text-sm text-white font-mono">{settings.primaryColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#6e6a60] block mb-1">Cor Secundária</label>
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border" style={{ background: '#09090a', borderColor: 'rgba(255,255,255,0.1)' }}>
                      <input type="color" value={settings.secondaryColor} onChange={e => set('secondaryColor', e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0" />
                      <span className="text-sm text-white font-mono">{settings.secondaryColor}</span>
                    </div>
                  </div>
                  {/* Preview gradient */}
                  <div>
                    <label className="text-xs text-[#6e6a60] block mb-1">Preview</label>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg" style={{ background: settings.primaryColor }} />
                      <div className="w-8 h-8 rounded-lg" style={{ background: settings.secondaryColor }} />
                      <div className="flex-1 h-8 rounded-lg" style={{ background: `linear-gradient(90deg, ${settings.primaryColor}, ${settings.secondaryColor})` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save button */}
            <div className="px-6 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <button
                onClick={save}
                disabled={saving}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
                style={{ background: `linear-gradient(135deg, #ef4444, #f97316)` }}
              >
                {saving ? 'Salvando...' : saved ? '✓ Configurações Salvas!' : 'Salvar Configurações'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: live preview */}
        <div className="flex-1 sticky top-8 self-start">
          <p className="text-xs text-[#6e6a60] uppercase tracking-wide font-mono mb-3 font-medium">Preview ao Vivo</p>
          <PortalPreview s={settings} />
          <p className="text-xs text-[rgba(255,255,255,0.16)] mt-3 text-center">
            As cores serão aplicadas na página que seus clientes veem ao acessar o link do orçamento.
          </p>
        </div>
      </div>
    </div>
  )
}
