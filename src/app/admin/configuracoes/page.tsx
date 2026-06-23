'use client'

import { useState, useEffect, useRef } from 'react'

type Profile = {
  name: string; company: string; phone: string; monthlyGoal: string
  zipCode: string; address: string; neighborhood: string; city: string; state: string
  logo: string | null
}

export default function ConfiguracoesPage() {
  const [profile, setProfile] = useState<Profile>({ name: '', company: '', phone: '', monthlyGoal: '', zipCode: '', address: '', neighborhood: '', city: '', state: '', logo: null })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/usuario/perfil')
      .then(r => r.json())
      .then(d => {
        setProfile({
          name: d.name ?? '',
          company: d.company ?? '',
          phone: d.phone ?? '',
          monthlyGoal: d.monthlyGoal ? String(d.monthlyGoal) : '',
          zipCode: d.zipCode ?? '',
          address: d.address ?? '',
          neighborhood: d.neighborhood ?? '',
          city: d.city ?? '',
          state: d.state ?? '',
          logo: d.logo ?? null,
        })
        setLogoPreview(d.logo ?? null)
        setLoading(false)
      })
  }, [])

  async function lookupCep(cep: string) {
    const clean = cep.replace(/\D/g, '')
    if (clean.length !== 8) return
    setCepLoading(true)
    try {
      const res = await fetch(`/api/cep/${clean}`)
      if (res.ok) {
        const d = await res.json()
        setProfile(p => ({ ...p, address: d.address || p.address, neighborhood: d.neighborhood || p.neighborhood, city: d.city || p.city, state: d.state || p.state }))
      }
    } finally { setCepLoading(false) }
  }

  async function save() {
    setSaving(true)
    let logoUrl = profile.logo
    if (logoFile) {
      const form = new FormData()
      form.append('files', logoFile)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const json = await res.json()
      logoUrl = json.urls?.[0] ?? logoUrl
    }
    await fetch('/api/usuario/perfil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...profile, logo: logoUrl, monthlyGoal: profile.monthlyGoal || null }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    setLogoFile(null)
  }

  const set = (k: keyof Profile, v: string) => setProfile(p => ({ ...p, [k]: v }))

  const inputCls = 'w-full px-4 py-3 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#D5FF40] transition-all'
  const inputStyle = { background: '#252525', border: '1px solid #333' }

  if (loading) return <div className="p-8 text-[#555]">Carregando…</div>

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-[#888] text-sm mt-0.5">Informações do seu perfil e empresa</p>
      </div>

      <div className="space-y-8">
        {/* Logo */}
        <section className="rounded-2xl border p-6 space-y-4" style={{ background: '#252525', borderColor: '#333' }}>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Logo</h2>
          <div className="flex items-center gap-6">
            <div
              className="w-24 h-24 rounded-xl flex items-center justify-center overflow-hidden"
              style={{ background: '#1E1E1E', border: '1px solid #333' }}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <span className="text-3xl">🖼️</span>
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0] ?? null
                  if (!file) return
                  setLogoFile(file)
                  const reader = new FileReader()
                  reader.onload = ev => setLogoPreview(ev.target?.result as string)
                  reader.readAsDataURL(file)
                }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="block px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
                style={{ background: '#D5FF40', color: '#1E1E1E' }}
              >
                {logoPreview ? 'Trocar logo' : 'Fazer upload'}
              </button>
              {logoPreview && (
                <button onClick={() => { setLogoFile(null); setLogoPreview(null); set('logo', '') }} className="block text-xs text-[#666] hover:text-red-400">
                  Remover
                </button>
              )}
              <p className="text-xs text-[#555]">PNG transparente recomendado</p>
            </div>
          </div>
        </section>

        {/* Dados pessoais */}
        <section className="rounded-2xl border p-6 space-y-4" style={{ background: '#252525', borderColor: '#333' }}>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Dados pessoais</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#888] mb-1.5 uppercase tracking-wide">Nome completo</label>
              <input className={inputCls} style={inputStyle} value={profile.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-[#888] mb-1.5 uppercase tracking-wide">Empresa / Estúdio</label>
              <input className={inputCls} style={inputStyle} value={profile.company} onChange={e => set('company', e.target.value)} placeholder="Studio Vertex" />
            </div>
            <div>
              <label className="block text-xs text-[#888] mb-1.5 uppercase tracking-wide">Telefone</label>
              <input className={inputCls} style={inputStyle} value={profile.phone} onChange={e => set('phone', e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <label className="block text-xs text-[#888] mb-1.5 uppercase tracking-wide">Meta mensal (R$)</label>
              <input className={inputCls} style={inputStyle} value={profile.monthlyGoal} onChange={e => set('monthlyGoal', e.target.value)} type="number" min="0" placeholder="10000" />
            </div>
          </div>
        </section>

        {/* Endereço */}
        <section className="rounded-2xl border p-6 space-y-4" style={{ background: '#252525', borderColor: '#333' }}>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Endereço</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#888] mb-1.5 uppercase tracking-wide">CEP</label>
              <div className="flex gap-2">
                <input className={inputCls} style={inputStyle} value={profile.zipCode} onChange={e => set('zipCode', e.target.value)} onBlur={e => lookupCep(e.target.value)} placeholder="00000-000" maxLength={9} />
                {cepLoading && <span className="text-xs text-[#666] self-center">…</span>}
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#888] mb-1.5 uppercase tracking-wide">Bairro</label>
              <input className={inputCls} style={inputStyle} value={profile.neighborhood} onChange={e => set('neighborhood', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-[#888] mb-1.5 uppercase tracking-wide">Endereço</label>
              <input className={inputCls} style={inputStyle} value={profile.address} onChange={e => set('address', e.target.value)} placeholder="Rua, Av…" />
            </div>
            <div>
              <label className="block text-xs text-[#888] mb-1.5 uppercase tracking-wide">Cidade</label>
              <input className={inputCls} style={inputStyle} value={profile.city} onChange={e => set('city', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-[#888] mb-1.5 uppercase tracking-wide">Estado</label>
              <input className={inputCls} style={inputStyle} value={profile.state} onChange={e => set('state', e.target.value)} maxLength={2} />
            </div>
          </div>
        </section>

        {/* Save */}
        <button
          onClick={save}
          disabled={saving}
          className="w-full py-3 rounded-xl font-semibold text-[#1E1E1E] transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: saved ? '#22c55e' : '#D5FF40' }}
        >
          {saving ? 'Salvando…' : saved ? '✓ Salvo!' : 'Salvar alterações'}
        </button>
      </div>
    </div>
  )
}
