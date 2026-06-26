'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

type Platform = 'android' | 'ios' | null

export function PwaInstallPrompt() {
  const [platform, setPlatform] = useState<Platform>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [dismissed, setDismissed] = useState(true) // start hidden until check

  useEffect(() => {
    // Already installed as PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    if (isStandalone) return

    // Already dismissed
    if (localStorage.getItem('pwa-prompt-dismissed')) return

    const ua = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
    const isAndroid = /Android/.test(ua)

    if (isIOS) {
      // iOS Safari: show manual instructions
      // Only show on Safari (not Chrome/Firefox on iOS)
      const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS/.test(ua)
      if (isSafari) {
        setPlatform('ios')
        setDismissed(false)
      }
      return
    }

    // Android / Chrome: wait for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setPlatform('android')
      setDismissed(false)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem('pwa-prompt-dismissed', '1')
    setDismissed(true)
  }

  async function install() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDismissed(true)
      }
      setDeferredPrompt(null)
    }
    dismiss()
  }

  if (dismissed || !platform) return null

  return (
    <div
      className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50 rounded-2xl p-4 shadow-2xl"
      style={{ background: '#252525', border: '1px solid #3a3a3a' }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center" style={{ background: '#1E1E1E' }}>
          <Image src="/logo.svg" alt="Freela3D" width={28} height={28} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Instalar Freela3D</p>
          {platform === 'android' ? (
            <p className="text-xs text-[#888] mt-0.5">Acesse rapidamente pelo ícone na tela inicial</p>
          ) : (
            <p className="text-xs text-[#888] mt-0.5">
              Toque em <span className="text-white">□↑</span> e depois em <span className="text-white">"Adicionar à Tela de Início"</span>
            </p>
          )}
        </div>
        <button onClick={dismiss} className="text-[#555] hover:text-[#888] text-lg leading-none shrink-0 -mt-0.5">✕</button>
      </div>

      {platform === 'android' && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={dismiss}
            className="flex-1 py-2 rounded-xl text-sm font-medium text-[#666] hover:text-[#888] transition-colors"
            style={{ background: '#1E1E1E' }}
          >
            Agora não
          </button>
          <button
            onClick={install}
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-[#1E1E1E] transition-colors"
            style={{ background: '#D5FF40' }}
          >
            Instalar
          </button>
        </div>
      )}

      {platform === 'ios' && (
        <button
          onClick={dismiss}
          className="w-full mt-3 py-2 rounded-xl text-sm font-medium text-[#666] hover:text-[#888] transition-colors"
          style={{ background: '#1E1E1E' }}
        >
          Entendi
        </button>
      )}
    </div>
  )
}
