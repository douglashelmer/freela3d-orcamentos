'use client'

import { useEffect, useState } from 'react'

type State = 'loading' | 'unsupported' | 'denied' | 'off' | 'on'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export function PushNotificationToggle() {
  const [state, setState] = useState<State>('loading')
  const [toggling, setToggling] = useState(false)

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
    })
  }, [])

  async function enable() {
    setToggling(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setState('denied'); return }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      })
      const json = sub.toJSON()
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint, keys: json.keys }),
      })
      setState('on')
    } catch {
      setState('off')
    } finally {
      setToggling(false)
    }
  }

  async function disable() {
    setToggling(true)
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
    } finally {
      setToggling(false)
    }
  }

  if (state === 'loading') return null

  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b" style={{ borderColor: '#333' }}>
      <div>
        <p className="text-sm font-medium text-white">Notificações push</p>
        <p className="text-xs text-[#666] mt-0.5">
          {state === 'unsupported' && 'Seu navegador não suporta notificações push.'}
          {state === 'denied' && 'Permissão negada. Habilite nas configurações do navegador.'}
          {state === 'off' && 'Receba alertas de orçamentos visualizados e assinados.'}
          {state === 'on' && 'Ativo neste dispositivo. Você receberá notificações importantes.'}
        </p>
      </div>

      {(state === 'off' || state === 'on') && (
        <button
          onClick={state === 'on' ? disable : enable}
          disabled={toggling}
          className="relative w-11 h-6 rounded-full transition-colors shrink-0 mt-0.5 disabled:opacity-50"
          style={{ background: state === 'on' ? '#D5FF40' : '#333' }}
          aria-label={state === 'on' ? 'Desativar notificações' : 'Ativar notificações'}
        >
          <span
            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform bg-white"
            style={{ transform: state === 'on' ? 'translateX(20px)' : 'translateX(0)' }}
          />
        </button>
      )}
    </div>
  )
}
