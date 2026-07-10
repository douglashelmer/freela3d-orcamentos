'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

type PdfSettings = {
  template: string
  primaryColor: string
  accentColor: string
  bgMode: 'light' | 'dark' | 'cream'
  bgColor: string
  textColor: string
  pdfLogo: string | null
  pdfBanner: string | null
  bgImage: string | null
  watermark: string
  introText: string
  termsText: string
  footerText: string
  blocks: {
    logo: boolean
    validity: boolean
    notes: boolean
    contact: boolean
  }
}

const DEFAULTS: PdfSettings = {
  template: 'modern',
  primaryColor: '#09090a',
  accentColor: '#e8b84b',
  bgMode: 'light',
  bgColor: '#FFFFFF',
  textColor: '#1A1A1A',
  pdfLogo: null,
  pdfBanner: null,
  bgImage: null,
  watermark: '',
  introText: '',
  termsText: '',
  footerText: '',
  blocks: { logo: true, validity: true, notes: true, contact: true },
}

const BG_PRESETS = {
  light: { bgColor: '#FFFFFF', textColor: '#1A1A1A' },
  dark:  { bgColor: '#1A1A1A', textColor: '#EEEEEE' },
  cream: { bgColor: '#FDF6EE', textColor: '#2D1F0E' },
}

const TEMPLATES = [
  { key: 'modern',   label: 'Moderno',    desc: 'Faixa escura com logo centralizado' },
  { key: 'classic',  label: 'Clássico',   desc: 'Faixa colorida, layout limpo' },
  { key: 'minimal',  label: 'Minimalista', desc: 'Sem faixa, apenas logo e título' },
]

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

function ImageUploadField({ label, value, onChange }: { label: string; value: string | null; onChange: (v: string | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div>
      <label className="block text-xs text-[#a8a296] mb-2 uppercase tracking-wide font-mono">{label}</label>
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-[rgba(255,255,255,0.1)]" style={{ maxHeight: 80 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="w-full object-cover" style={{ maxHeight: 80 }} />
          <button
            onClick={() => onChange(null)}
            className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs text-white"
            style={{ background: 'rgba(0,0,0,0.7)' }}
          >✕</button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full py-3 rounded-xl border border-dashed text-sm flex items-center justify-center gap-2 text-[#6e6a60] hover:text-[#a8a296] transition-colors"
          style={{ borderColor: 'rgba(255,255,255,0.1)' }}
        >
          ↑ Enviar imagem (PNG/JPG até 4MB)
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file || file.size > 4 * 1024 * 1024) return
          onChange(await fileToBase64(file))
        }}
      />
    </div>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs text-[#a8a296] mb-2 uppercase tracking-wide font-mono">{label}</label>
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[rgba(255,255,255,0.1)]" style={{ background: '#09090a' }}>
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
        />
        <span className="text-sm text-white font-mono">{value.toUpperCase()}</span>
      </div>
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full py-3 border-b last:border-0"
      style={{ borderColor: '#1c1b1e' }}
    >
      <span className="text-sm text-white">{label}</span>
      <div
        className="w-10 h-6 rounded-full transition-colors relative"
        style={{ background: checked ? '#e8b84b' : 'rgba(255,255,255,0.1)' }}
      >
        <div
          className="w-4 h-4 bg-white rounded-full absolute top-1 transition-all"
          style={{ left: checked ? 22 : 4 }}
        />
      </div>
    </button>
  )
}

// Live preview component
function PdfPreview({ s }: { s: PdfSettings }) {
  const isLight = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return (r * 299 + g * 587 + b * 114) / 1000 > 128
  }
  const headerTextColor = isLight(s.primaryColor) ? '#1A1A1A' : '#FFFFFF'
  const accentTextColor = isLight(s.accentColor) ? '#1A1A1A' : '#FFFFFF'

  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: s.bgColor, width: 320, color: s.textColor, fontSize: 7, fontFamily: 'Arial, sans-serif', position: 'relative' }}>
      {/* Watermark */}
      {s.watermark && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%) rotate(-35deg)',
          fontSize: 28, fontWeight: 900, opacity: 0.06,
          color: s.textColor, pointerEvents: 'none', zIndex: 10,
          whiteSpace: 'nowrap',
        }}>{s.watermark}</div>
      )}

      {/* Header */}
      {s.pdfBanner ? (
        <div style={{ position: 'relative', height: 48 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.pdfBanner} alt="" style={{ width: '100%', height: 48, objectFit: 'cover' }} />
          {s.blocks.logo && s.pdfLogo && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={s.pdfLogo} alt="" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', height: 20, objectFit: 'contain' }} />
          )}
        </div>
      ) : s.template === 'minimal' ? (
        <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {s.blocks.logo && (s.pdfLogo
            ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={s.pdfLogo} alt="" style={{ height: 16, objectFit: 'contain' }} />
            : <span style={{ fontWeight: 700, fontSize: 9, color: s.primaryColor }}>EMPRESA</span>
          )}
          <span style={{ fontSize: 14, fontWeight: 900, color: s.accentColor }}>ORÇAMENTO</span>
        </div>
      ) : (
        <div style={{ background: s.primaryColor, padding: '12px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          {s.blocks.logo && (s.pdfLogo
            ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={s.pdfLogo} alt="" style={{ height: 16, objectFit: 'contain' }} />
            : <span style={{ color: headerTextColor, fontWeight: 700, fontSize: 9, opacity: 0.7 }}>LOGO</span>
          )}
          <span style={{ color: headerTextColor, fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>ORÇAMENTO</span>
          <span style={{ color: headerTextColor, fontSize: 7, opacity: 0.6 }}>PRÉVIA-001</span>
        </div>
      )}

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Client + Details row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <div style={{ fontSize: 6, textTransform: 'uppercase', opacity: 0.5, marginBottom: 3 }}>Cliente</div>
            <div style={{ fontWeight: 700, fontSize: 8 }}>Cliente Exemplo</div>
            <div style={{ opacity: 0.6, fontSize: 7 }}>(11) 99999-9999</div>
            <div style={{ marginTop: 6, fontWeight: 700 }}>Projeto exemplo</div>
            <div style={{ opacity: 0.5, fontSize: 6 }}>Descrição breve do projeto</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 6, textTransform: 'uppercase', opacity: 0.5, marginBottom: 3 }}>Detalhes</div>
            <div style={{ fontSize: 7 }}>Data: 24/06/2026</div>
            {s.blocks.validity && <div style={{ fontSize: 7 }}>Validade: 07/07/2026</div>}
            <div style={{ fontSize: 7 }}>Prazo: 15 dias</div>
          </div>
        </div>

        {/* Intro text */}
        {s.introText && (
          <div style={{ fontSize: 6, opacity: 0.6, fontStyle: 'italic', borderLeft: `2px solid ${s.accentColor}`, paddingLeft: 6 }}>
            {s.introText.slice(0, 80)}
          </div>
        )}

        {/* Divider */}
        <div style={{ borderTop: `1px solid ${s.textColor}22` }} />

        {/* Services table */}
        <div>
          <div style={{ fontSize: 6, textTransform: 'uppercase', opacity: 0.5, marginBottom: 4 }}>Serviços</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 7 }}>
            <thead>
              <tr style={{ background: s.accentColor }}>
                {['Item', 'Qtd', 'Valor Unit.', 'Total'].map(h => (
                  <th key={h} style={{ padding: '3px 4px', textAlign: h === 'Item' ? 'left' : 'right', color: accentTextColor, fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[['Serviço A', '1', 'R$ 1.500,00', 'R$ 1.500,00'], ['Serviço B', '2', 'R$ 800,00', 'R$ 1.600,00'], ['Serviço C', '4', 'R$ 350,00', 'R$ 1.400,00']].map((row, i) => (
                <tr key={i} style={{ background: i % 2 ? `${s.textColor}08` : 'transparent' }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: '3px 4px', textAlign: j === 0 ? 'left' : 'right' }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ borderTop: `1px solid ${s.textColor}22`, paddingTop: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ opacity: 0.5 }}>Subtotal</span><span>R$ 4.500,00</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#f87171' }}>
            <span>Desconto</span><span>-R$ 100,00</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 9 }}>
            <span>TOTAL:</span>
            <span style={{ color: s.accentColor }}>R$ 4.400,00</span>
          </div>
        </div>

        {/* Notes */}
        {s.blocks.notes && (
          <div style={{ borderTop: `1px solid ${s.textColor}22`, paddingTop: 6 }}>
            <div style={{ fontSize: 6, textTransform: 'uppercase', opacity: 0.5, marginBottom: 3 }}>Condições de Pagamento</div>
            <div style={{ fontSize: 7, opacity: 0.7 }}>50% no início, 50% na entrega</div>
          </div>
        )}

        {/* Terms */}
        {s.termsText && (
          <div style={{ borderTop: `1px solid ${s.textColor}22`, paddingTop: 6, fontSize: 6, opacity: 0.6 }}>
            {s.termsText.slice(0, 100)}
          </div>
        )}

        {/* Footer */}
        {(s.footerText || s.blocks.contact) && (
          <div style={{ borderTop: `1px solid ${s.textColor}22`, paddingTop: 6, textAlign: 'center', fontSize: 6, opacity: 0.5 }}>
            {s.footerText || 'contato@empresa.com.br'}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PdfSettingsPage() {
  const [settings, setSettings] = useState<PdfSettings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/pdf-settings')
      .then(r => r.json())
      .then(data => { setSettings({ ...DEFAULTS, ...data, blocks: { ...DEFAULTS.blocks, ...data.blocks } }); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function set<K extends keyof PdfSettings>(key: K, value: PdfSettings[K]) {
    setSettings(s => ({ ...s, [key]: value }))
  }

  function setBlock(key: keyof PdfSettings['blocks'], value: boolean) {
    setSettings(s => ({ ...s, blocks: { ...s.blocks, [key]: value } }))
  }

  function applyBgMode(mode: 'light' | 'dark' | 'cream') {
    const preset = BG_PRESETS[mode]
    setSettings(s => ({ ...s, bgMode: mode, bgColor: preset.bgColor, textColor: preset.textColor }))
  }

  async function save() {
    setSaving(true)
    setSaved(false)
    const res = await fetch('/api/pdf-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    else alert('Erro ao salvar. Verifique se rodou migration_v9.sql no DbGate.')
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#e8b84b]'
  const inputStyle = { background: '#09090a', border: '1px solid rgba(255,255,255,0.1)' }
  const sectionCls = 'rounded-2xl p-6 space-y-4'
  const sectionStyle = { background: '#161518', border: '1px solid rgba(255,255,255,0.1)' }

  if (loading) return <div className="p-8 text-[#6e6a60]">Carregando…</div>

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Settings */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Link href="/admin/orcamentos" className="text-[#6e6a60] hover:text-white text-xl leading-none transition-colors">←</Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Personalizar PDF</h1>
              <p className="text-[#a8a296] text-sm mt-0.5">Configurações aplicadas em todos os orçamentos</p>
            </div>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-[#09090a] disabled:opacity-40 transition-all"
            style={{ background: saved ? '#22c55e' : '#e8b84b' }}
          >
            {saving ? 'Salvando…' : saved ? '✓ Salvo' : 'Salvar'}
          </button>
        </div>

        {/* Cabeçalho do PDF */}
        <div className={sectionCls} style={sectionStyle}>
          <div>
            <h2 className="text-base font-semibold text-white">Cabeçalho do PDF</h2>
            <p className="text-xs text-[#6e6a60] mt-0.5">Personalize a logo e o banner exibidos no topo do PDF.</p>
          </div>
          <ImageUploadField
            label="Logo do cabeçalho (substitui a do perfil)"
            value={settings.pdfLogo}
            onChange={v => set('pdfLogo', v)}
          />
          <ImageUploadField
            label="Banner / imagem do topo (largura total)"
            value={settings.pdfBanner}
            onChange={v => set('pdfBanner', v)}
          />
          {settings.pdfBanner && (
            <p className="text-xs text-[#6e6a60]">Quando há banner, ele substitui a faixa colorida do topo. A logo (se houver) é sobreposta centralizada.</p>
          )}
        </div>

        {/* Estilo visual */}
        <div className={sectionCls} style={sectionStyle}>
          <div>
            <h2 className="text-base font-semibold text-white">Estilo visual</h2>
            <p className="text-xs text-[#6e6a60] mt-0.5">Escolha o template e as cores do seu PDF.</p>
          </div>

          <div>
            <label className="block text-xs text-[#a8a296] mb-2 uppercase tracking-wide font-mono">Template</label>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.key}
                  onClick={() => set('template', t.key)}
                  className="p-3 rounded-xl text-left transition-all"
                  style={{
                    background: settings.template === t.key ? '#e8b84b15' : '#09090a',
                    border: `1px solid ${settings.template === t.key ? '#e8b84b' : 'rgba(255,255,255,0.1)'}`,
                  }}
                >
                  <p className="text-xs font-semibold text-white mb-0.5">{t.label}</p>
                  <p className="text-[10px] text-[#6e6a60]">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ColorField label="Cor primária (header)" value={settings.primaryColor} onChange={v => set('primaryColor', v)} />
            <ColorField label="Cor de destaque (totais, tabela)" value={settings.accentColor} onChange={v => set('accentColor', v)} />
          </div>
        </div>

        {/* Fundo da página */}
        <div className={sectionCls} style={sectionStyle}>
          <div>
            <h2 className="text-base font-semibold text-white">Fundo da página</h2>
            <p className="text-xs text-[#6e6a60] mt-0.5">Cor de fundo, imagem/template e marca d&apos;água.</p>
          </div>

          <div>
            <label className="block text-xs text-[#a8a296] mb-2 uppercase tracking-wide font-mono">Modo do PDF</label>
            <div className="grid grid-cols-3 gap-2">
              {([['light', '☀️', 'Claro'], ['dark', '🌙', 'Escuro'], ['cream', '●', 'Creme']] as const).map(([mode, icon, label]) => (
                <button
                  key={mode}
                  onClick={() => applyBgMode(mode)}
                  className="py-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1"
                  style={{
                    background: settings.bgMode === mode ? '#e8b84b15' : '#09090a',
                    border: `1px solid ${settings.bgMode === mode ? '#e8b84b' : 'rgba(255,255,255,0.1)'}`,
                    color: settings.bgMode === mode ? '#e8b84b' : '#a8a296',
                  }}
                >
                  <span className="text-lg">{icon}</span>
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ColorField label="Cor de fundo" value={settings.bgColor} onChange={v => set('bgColor', v)} />
            <ColorField label="Cor do texto" value={settings.textColor} onChange={v => set('textColor', v)} />
          </div>

          <ImageUploadField
            label="Imagem de fundo / template"
            value={settings.bgImage}
            onChange={v => set('bgImage', v)}
          />

          <div>
            <label className="block text-xs text-[#a8a296] mb-2 uppercase tracking-wide font-mono">Marca d&apos;água</label>
            <input
              className={inputCls}
              style={inputStyle}
              value={settings.watermark}
              onChange={e => set('watermark', e.target.value)}
              placeholder="Ex.: CONFIDENCIAL, RASCUNHO, NOME DA EMPRESA"
            />
          </div>
        </div>

        {/* Textos personalizados */}
        <div className={sectionCls} style={sectionStyle}>
          <div>
            <h2 className="text-base font-semibold text-white">Textos personalizados</h2>
            <p className="text-xs text-[#6e6a60] mt-0.5">Aparecem em todos os PDFs gerados.</p>
          </div>

          <div>
            <label className="block text-xs text-[#a8a296] mb-2 uppercase tracking-wide font-mono">Introdução (acima dos serviços)</label>
            <textarea
              className={inputCls}
              style={{ ...inputStyle, resize: 'none' }}
              rows={3}
              value={settings.introText}
              onChange={e => set('introText', e.target.value)}
              placeholder="Ex.: Agradecemos a oportunidade. Segue nossa proposta…"
            />
          </div>

          <div>
            <label className="block text-xs text-[#a8a296] mb-2 uppercase tracking-wide font-mono">Observações / termos (após pagamento)</label>
            <textarea
              className={inputCls}
              style={{ ...inputStyle, resize: 'none' }}
              rows={3}
              value={settings.termsText}
              onChange={e => set('termsText', e.target.value)}
              placeholder="Ex.: Os valores são válidos por 15 dias. Não inclui deslocamento…"
            />
          </div>

          <div>
            <label className="block text-xs text-[#a8a296] mb-2 uppercase tracking-wide font-mono">Rodapé</label>
            <input
              className={inputCls}
              style={inputStyle}
              value={settings.footerText}
              onChange={e => set('footerText', e.target.value)}
              placeholder="Ex.: contato@empresa.com.br · (11) 99999-9999"
            />
          </div>
        </div>

        {/* Blocos exibidos */}
        <div className={sectionCls} style={sectionStyle}>
          <div>
            <h2 className="text-base font-semibold text-white">Blocos exibidos</h2>
            <p className="text-xs text-[#6e6a60] mt-0.5">Mostre ou oculte seções do PDF.</p>
          </div>
          <div>
            <Toggle label="Logo no cabeçalho" checked={settings.blocks.logo} onChange={v => setBlock('logo', v)} />
            <Toggle label="Validade do orçamento" checked={settings.blocks.validity} onChange={v => setBlock('validity', v)} />
            <Toggle label="Observações / condições de pagamento" checked={settings.blocks.notes} onChange={v => setBlock('notes', v)} />
            <Toggle label="Informações de contato no rodapé" checked={settings.blocks.contact} onChange={v => setBlock('contact', v)} />
          </div>
        </div>

        {/* Save bottom */}
        <div className="flex justify-end pb-8">
          <button
            onClick={save}
            disabled={saving}
            className="px-8 py-3 rounded-xl text-sm font-semibold text-[#09090a] disabled:opacity-40"
            style={{ background: saved ? '#22c55e' : '#e8b84b' }}
          >
            {saving ? 'Salvando…' : saved ? '✓ Configurações salvas!' : 'Salvar configurações'}
          </button>
        </div>
      </div>

      {/* Right: Live preview */}
      <div className="w-[400px] shrink-0 border-l flex flex-col" style={{ borderColor: '#1c1b1e', background: '#161518' }}>
        <div className="px-6 py-4 border-b shrink-0" style={{ borderColor: '#1c1b1e' }}>
          <p className="text-sm font-semibold text-white">Prévia ao vivo</p>
          <p className="text-xs text-[#6e6a60]">Dados de exemplo</p>
        </div>
        <div className="flex-1 overflow-y-auto p-6 flex items-start justify-center">
          <PdfPreview s={settings} />
        </div>
      </div>
    </div>
  )
}
