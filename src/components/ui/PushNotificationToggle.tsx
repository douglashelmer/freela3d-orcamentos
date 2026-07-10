'use client'

import { useEffect, useState } from 'react'

type State = 'loading' | 'unsupported' | 'denied' | 'off' | 'on' | 'error'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

async function getVapidKey(): Promise<string> {
  const res = await fetch('/api/push/config')
  if (!res.ok) throw new Error('Failed to fetch VAPID config')
  const data = await res.json()
  if (!data.configured || !data.vapidPublicKey) throw new Error('Push not configured on server')
  return data.vapidPublicKey
}

export function PushNotificationToggle() {
  const [state, setState] = useState<State>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [toggling, setToggling] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testMsg, setTestMsg] = useState('')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setState('denied')
      return
    }
    navigator.serviceWorker.ready.then(async reg => {
      const sub = await reg.pushManager.getSubscription()
      setState(sub ? 'on' : 'off')
    }).catch(() => setState('off'))
  }, [])

  async function enable() {
    setToggling(true)
    setErrorMsg('')
    try {
      const vapidKey = await getVapidKey()

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setState('denied'); return }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
      const json = sub.toJSON()
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint, keys: json.keys }),
      })
      if (!res.ok) throw new Error('Falha ao salvar assinatura')
      setState('on')
    } catch (err: any) {
      console.error('Push subscribe error:', err)
      setErrorMsg(err?.message ?? 'Erro ao ativar notificações')
      setState('error')
    } finally {
      setToggling(false)
    }
  }

  async function disable() {
    setToggling(true)
    setErrorMsg('')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setState('off')
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Erro ao desativar')
    } finally {
      setToggling(false)
    }
  }

  async function sendTest() {
    setTesting(true)
    setTestMsg('')
    try {
      const res = await fetch('/api/push/test', { method: 'POST' })
      const data = await res.json()
      setTestMsg(res.ok ? '✓ Notificação enviada!' : `Erro: ${data.error}`)
    } catch {
      setTestMsg('Erro ao enviar')
    } finally {
      setTesting(false)
      setTimeout(() => setTestMsg(''), 4000)
    }
  }

  if (state === 'loading') return null

  const descriptions: Record<State, string> = {
    loading: '',
    unsupported: 'Seu navegador não suporta notificações push.',
    denied: 'Permissão negada. Habilite nas configurações do navegador.',
    off: 'Receba alertas de orçamentos visualizados e assinados.',
    on: 'Ativo neste dispositivo. Você receberá notificações importantes.',
    error: errorMsg || 'Erro ao configurar notificações.',
  }

  return (
    <div className="py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white">Notificações push</p>
          <p className="text-xs mt-0.5" style={{ color: state === 'error' ? '#f87171' : '#6e6a60' }}>
            {descriptions[state]}
          </p>
        </div>

        {(state === 'off' || state === 'on' || state === 'error') && (
          <button
            onClick={state === 'on' ? disable : enable}
            disabled={toggling}
            className="relative w-11 h-6 rounded-full transition-colors shrink-0 mt-0.5 disabled:opacity-50"
            style={{ background: state === 'on' ? '#e8b84b' : 'rgba(255,255,255,0.1)' }}
            aria-label={state === 'on' ? 'Desativar notificações' : 'Ativar notificações'}
          >
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform bg-white"
              style={{ transform: state === 'on' ? 'translateX(20px)' : 'translateX(0)' }}
            />
          </button>
        )}
      </div>

      {state === 'on' && (
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={sendTest}
            disabled={testing}
            className="text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50"
            style={{ borderColor: 'rgba(255,255,255,0.16)', color: '#a8a296' }}
          >
            {testing ? 'Enviando...' : 'Enviar notificação de teste'}
          </button>
          {testMsg && (
            <span className="text-xs" style={{ color: testMsg.startsWith('✓') ? '#e8b84b' : '#f87171' }}>
              {testMsg}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
