'use client'

import { useState, useEffect, useRef } from 'react'
import { PushNotificationToggle } from '@/components/ui/PushNotificationToggle'

type Profile = {
  name: string; company: string; phone: string; monthlyGoal: string
  zipCode: string; address: string; neighborhood: string; city: string; state: string
  logo: string | null; metaPixelId: string
}

type NotifPrefs = {
  novosLeads: boolean; propostasAbertas: boolean; prazos: boolean
  pagamentos: boolean; dicas: boolean
}

const DEFAULT_NOTIF: NotifPrefs = {
  novosLeads: true, propostasAbertas: true, prazos: true, pagamentos: true, dicas: false,
}

const TABS = ['Perfil', 'Notificações', 'Integrações', 'Segurança'] as const
type Tab = typeof TABS[number]

export default function ConfiguracoesPage() {
  const [tab, setTab] = useState<Tab>('Perfil')
  const [profile, setProfile] = useState<Profile>({
    name: '', company: '', phone: '', monthlyGoal: '',
    zipCode: '', address: '', neighborhood: '', city: '', state: '',
    logo: null, metaPixelId: '',
  })
  const [notif, setNotif] = useState<NotifPrefs>(DEFAULT_NOTIF)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [gcalConnected, setGcalConnected] = useState(false)
  const [gcalDisconnecting, setGcalDisconnecting] = useState(false)
  const [gcalError, setGcalError] = useState<string | null>(null)

  // Password change
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' })
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('gcal') === 'error') {
      setGcalError(params.get('msg') ?? 'Erro desconhecido ao conectar Google Agenda')
      setTab('Integrações')
      window.history.replaceState({}, '', '/admin/configuracoes')
    }
  }, [])

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
          metaPixelId: d.metaPixelId ?? '',
        })
        setLogoPreview(d.logo ?? null)
        setGcalConnected(d.googleCalendarConnected ?? false)
        if (d.notificationPrefs) {
          try { setNotif({ ...DEFAULT_NOTIF, ...JSON.parse(d.notificationPrefs) }) } catch {}
        }
        setLoading(false)
      })
  }, [])

  async function disconnectGcal() {
    setGcalDisconnecting(true)
    await fetch('/api/agenda/google/disconnect', { method: 'POST' })
    setGcalConnected(false)
    setGcalDisconnecting(false)
  }

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
      logoUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(logoFile)
      })
    }
    await fetch('/api/usuario/perfil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: profile.name, company: profile.company, phone: profile.phone,
        zipCode: profile.zipCode, address: profile.address, neighborhood: profile.neighborhood,
        city: profile.city, state: profile.state,
        monthlyGoal: profile.monthlyGoal || null,
        logo: logoUrl,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    setLogoFile(null)
  }

  async function saveNotif() {
    setSaving(true)
    await fetch('/api/usuario/perfil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationPrefs: JSON.stringify(notif) }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function saveInteg() {
    setSaving(true)
    await fetch('/api/usuario/perfil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metaPixelId: profile.metaPixelId }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function changePassword() {
    if (!pwd.current || !pwd.next || pwd.next !== pwd.confirm) {
      setPwdMsg({ ok: false, text: pwd.next !== pwd.confirm ? 'As senhas não coincidem' : 'Preencha todos os campos' })
      return
    }
    if (pwd.next.length < 6) {
      setPwdMsg({ ok: false, text: 'A nova senha precisa ter ao menos 6 caracteres' })
      return
    }
    setPwdSaving(true)
    const res = await fetch('/api/usuario/senha', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: pwd.current, newPassword: pwd.next }),
    })
    const data = await res.json()
    if (res.ok) {
      setPwdMsg({ ok: true, text: 'Senha alterada com sucesso!' })
      setPwd({ current: '', next: '', confirm: '' })
    } else {
      setPwdMsg({ ok: false, text: data.error ?? 'Erro ao alterar senha' })
    }
    setPwdSaving(false)
    setTimeout(() => setPwdMsg(null), 4000)
  }

  const set = (k: keyof Profile, v: string) => setProfile(p => ({ ...p, [k]: v }))

  const inputCls = 'w-full px-4 py-3 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#D5FF40] transition-all'
  const inputStyle = { background: '#252525', border: '1px solid #333' }

  if (loading) return <div className="p-8 text-[#555]">Carregando…</div>

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-5 border-b shrink-0" style={{ borderColor: '#2a2a2a' }}>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-[#888] text-sm mt-0.5">Personalize sua experiência no Freela3D</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-8 py-3 border-b shrink-0" style={{ borderColor: '#2a2a2a' }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: tab === t ? '#D5FF40' : 'transparent',
              color: tab === t ? '#1E1E1E' : '#888',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-2xl space-y-6">

          {/* ── PERFIL ── */}
          {tab === 'Perfil' && (
            <>
              {/* Logo */}
              <section className="rounded-2xl border p-6 space-y-4" style={{ background: '#252525', borderColor: '#333' }}>
                <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Logo</h2>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: '#1E1E1E', border: '1px solid #333' }}>
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <span className="text-3xl text-[#444]">🖼️</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0] ?? null
                        if (!file) return
                        setLogoFile(file)
                        const reader = new FileReader()
                        reader.onload = ev => setLogoPreview(ev.target?.result as string)
                        reader.readAsDataURL(file)
                      }}
                    />
                    <button onClick={() => fileRef.current?.click()} className="block px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity" style={{ background: '#D5FF40', color: '#1E1E1E' }}>
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

              <button onClick={save} disabled={saving} className="w-full py-3 rounded-xl font-semibold text-[#1E1E1E] transition-opacity hover:opacity-90 disabled:opacity-50" style={{ background: saved ? '#22c55e' : '#D5FF40' }}>
                {saving ? 'Salvando…' : saved ? '✓ Salvo!' : 'Salvar alterações'}
              </button>
            </>
          )}

          {/* ── NOTIFICAÇÕES ── */}
          {tab === 'Notificações' && (
            <>
              <section className="rounded-2xl border p-6 space-y-5" style={{ background: '#252525', borderColor: '#333' }}>
                <div>
                  <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Notificações</h2>
                  <p className="text-xs text-[#666] mt-1">Gerencie como você recebe atualizações</p>
                </div>

                {/* Push notifications toggle */}
                <PushNotificationToggle />

                {([
                  { key: 'novosLeads', label: 'Novos Leads', desc: 'Seja notificado quando receber um novo lead' },
                  { key: 'propostasAbertas', label: 'Propostas Abertas', desc: 'Quando o cliente visualizar sua proposta' },
                  { key: 'prazos', label: 'Prazos Próximos', desc: 'Alerta 2 dias antes do prazo de uma tarefa' },
                  { key: 'pagamentos', label: 'Pagamentos Recebidos', desc: 'Confirmação de pagamentos no financeiro' },
                  { key: 'dicas', label: 'Dicas e Sugestões', desc: 'Receba dicas semanais para melhorar sua gestão' },
                ] as { key: keyof NotifPrefs; label: string; desc: string }[]).map(item => (
                  <div key={item.key} className="flex items-center justify-between py-3 border-t" style={{ borderColor: '#333' }}>
                    <div>
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="text-xs text-[#666]">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotif(n => ({ ...n, [item.key]: !n[item.key] }))}
                      className="relative w-11 h-6 rounded-full transition-colors shrink-0"
                      style={{ background: notif[item.key] ? '#D5FF40' : '#444' }}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${notif[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </section>

              <button onClick={saveNotif} disabled={saving} className="w-full py-3 rounded-xl font-semibold text-[#1E1E1E] transition-opacity hover:opacity-90 disabled:opacity-50" style={{ background: saved ? '#22c55e' : '#D5FF40' }}>
                {saving ? 'Salvando…' : saved ? '✓ Salvo!' : 'Salvar preferências'}
              </button>
            </>
          )}

          {/* ── INTEGRAÇÕES ── */}
          {tab === 'Integrações' && (
            <>
              {/* Google Calendar */}
              <section className="rounded-2xl border p-6 space-y-4" style={{ background: '#252525', borderColor: '#333' }}>
                <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Google Agenda</h2>
                {gcalError && (
                  <div className="rounded-xl p-3 text-xs text-red-400 break-all" style={{ background: '#3a1a1a', border: '1px solid #f8717133' }}>
                    <p className="font-semibold mb-1">Erro ao conectar:</p>
                    <p>{gcalError}</p>
                  </div>
                )}
                {gcalConnected ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#1a2e1a' }}>
                        <span className="text-green-400 text-lg">✓</span>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">Google Calendar conectado</p>
                        <p className="text-[#666] text-xs">Seus eventos do Google aparecem na Agenda</p>
                      </div>
                    </div>
                    <button onClick={disconnectGcal} disabled={gcalDisconnecting} className="px-4 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50">
                      {gcalDisconnecting ? 'Desconectando…' : 'Desconectar'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">Sincronizar com Google Calendar</p>
                      <p className="text-[#666] text-xs">Visualize seus eventos do Google direto na Agenda</p>
                    </div>
                    <a href="/api/agenda/google/auth" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-80" style={{ background: '#D5FF40', color: '#1E1E1E' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Conectar Google Agenda
                    </a>
                  </div>
                )}
              </section>

              {/* Meta Pixel */}
              <section className="rounded-2xl border p-6 space-y-4" style={{ background: '#252525', borderColor: '#333' }}>
                <div>
                  <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Meta Pixel</h2>
                  <p className="text-xs text-[#666] mt-1">Rastreie visitas às páginas públicas dos seus orçamentos</p>
                </div>
                <div>
                  <label className="block text-xs text-[#888] mb-1.5 uppercase tracking-wide">ID do Pixel</label>
                  <input
                    className={inputCls} style={inputStyle}
                    value={profile.metaPixelId}
                    onChange={e => set('metaPixelId', e.target.value)}
                    placeholder="1234567890123456"
                  />
                </div>
                <button onClick={saveInteg} disabled={saving} className="w-full py-3 rounded-xl font-semibold text-[#1E1E1E] transition-opacity hover:opacity-90 disabled:opacity-50" style={{ background: saved ? '#22c55e' : '#D5FF40' }}>
                  {saving ? 'Salvando…' : saved ? '✓ Salvo!' : 'Salvar integrações'}
                </button>
              </section>
            </>
          )}

          {/* ── SEGURANÇA ── */}
          {tab === 'Segurança' && (
            <section className="rounded-2xl border p-6 space-y-5" style={{ background: '#252525', borderColor: '#333' }}>
              <div>
                <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Alterar Senha</h2>
                <p className="text-xs text-[#666] mt-1">Digite sua senha atual e a nova senha para alterá-la</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-[#888] mb-1.5 uppercase tracking-wide">Senha atual</label>
                  <input className={inputCls} style={inputStyle} type="password" value={pwd.current} onChange={e => setPwd(p => ({ ...p, current: e.target.value }))} placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-xs text-[#888] mb-1.5 uppercase tracking-wide">Nova senha</label>
                  <input className={inputCls} style={inputStyle} type="password" value={pwd.next} onChange={e => setPwd(p => ({ ...p, next: e.target.value }))} placeholder="Mínimo 6 caracteres" />
                </div>
                <div>
                  <label className="block text-xs text-[#888] mb-1.5 uppercase tracking-wide">Confirmar nova senha</label>
                  <input className={inputCls} style={inputStyle} type="password" value={pwd.confirm} onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))} placeholder="••••••••" />
                </div>
              </div>
              {pwdMsg && (
                <div className="rounded-xl p-3 text-sm text-center" style={{ background: pwdMsg.ok ? '#1a2e1a' : '#3a1a1a', color: pwdMsg.ok ? '#34d399' : '#f87171' }}>
                  {pwdMsg.text}
                </div>
              )}
              <button onClick={changePassword} disabled={pwdSaving} className="w-full py-3 rounded-xl font-semibold text-[#1E1E1E] transition-opacity hover:opacity-90 disabled:opacity-50" style={{ background: '#D5FF40' }}>
                {pwdSaving ? 'Alterando…' : 'Atualizar Senha'}
              </button>
            </section>
          )}

        </div>
      </div>
    </div>
  )
}
