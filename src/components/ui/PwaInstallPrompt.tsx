'use client'

import { useEffect, useState } from 'react'

type Platform = 'android' | 'ios' | null

export function PwaInstallPrompt() {
  const [platform, setPlatform] = useState<Platform>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Already installed as PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    if (isStandalone) return

    if (localStorage.getItem('pwa-prompt-dismissed')) return

    const ua = navigator.userAgent
    const isMobile = window.innerWidth < 900 || /Android|iPhone|iPad|iPod/i.test(ua)
    if (!isMobile) return

    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
    const isAndroid = /Android/.test(ua) || (!isIOS && isMobile)

    if (isIOS) {
      const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS/.test(ua)
      if (!isSafari) return
      setPlatform('ios')
    } else {
      setPlatform('android')
      const handler = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e)
      }
      window.addEventListener('beforeinstallprompt', handler)
      // Cleanup returned below
    }

    // Small delay to not flash on first paint
    const t = setTimeout(() => setVisible(true), 1200)

    return () => {
      clearTimeout(t)
      window.removeEventListener('beforeinstallprompt', () => {})
    }
  }, [])

  function dismiss() {
    localStorage.setItem('pwa-prompt-dismissed', '1')
    setVisible(false)
  }

  async function install() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') { setVisible(false); return }
      setDeferredPrompt(null)
    }
    dismiss()
  }

  if (!visible || !platform) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        onClick={dismiss}
      />

      {/* Modal */}
      <div
        className="fixed z-50 left-4 right-4 rounded-3xl p-6 shadow-2xl"
        style={{
          bottom: '50%',
          transform: 'translateY(50%)',
          background: '#0f0f11',
          border: '1px solid #1c1b1e',
          maxWidth: 400,
          margin: '0 auto',
        }}
      >
        {/* Icon */}
        <div className="flex justify-center mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-atlaz.png" alt="Atlaz" width={72} height={72} className="rounded-2xl" />
        </div>

        <h2 className="text-lg font-bold text-white text-center mb-1">Instalar Atlaz</h2>
        <p className="text-sm text-center mb-5" style={{ color: '#a8a296' }}>
          Adicione à tela inicial para acesso rápido e notificações
        </p>

        {platform === 'ios' && (
          <>
            <div className="rounded-2xl p-4 mb-4 text-sm" style={{ background: '#161518' }}>
              <p className="text-white mb-3 font-medium">Como instalar no iPhone / iPad:</p>
              <div className="flex items-start gap-3 mb-2">
                <span className="text-xl shrink-0">1️⃣</span>
                <p style={{ color: '#a8a296' }}>Toque no ícone de compartilhar <span className="text-white font-bold">□↑</span> na barra do Safari</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0">2️⃣</span>
                <p style={{ color: '#a8a296' }}>Toque em <span className="text-white font-bold">"Adicionar à Tela de Início"</span></p>
              </div>
            </div>
            <button
              onClick={dismiss}
              className="w-full py-3.5 rounded-full text-sm font-semibold"
              style={{ background: '#e8b84b', color: '#09090a' }}
            >
              Entendi
            </button>
          </>
        )}

        {platform === 'android' && (
          <>
            {!deferredPrompt ? (
              <>
                <div className="rounded-2xl p-4 mb-4 text-sm" style={{ background: '#161518' }}>
                  <p className="text-white mb-3 font-medium">Como instalar no Android:</p>
                  <div className="flex items-start gap-3 mb-2">
                    <span className="text-xl shrink-0">1️⃣</span>
                    <p style={{ color: '#a8a296' }}>Toque no menu <span className="text-white font-bold">⋮</span> do Chrome</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xl shrink-0">2️⃣</span>
                    <p style={{ color: '#a8a296' }}>Toque em <span className="text-white font-bold">"Adicionar à tela inicial"</span></p>
                  </div>
                </div>
                <button
                  onClick={dismiss}
                  className="w-full py-3.5 rounded-full text-sm font-semibold"
                  style={{ background: '#e8b84b', color: '#09090a' }}
                >
                  Entendi
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-center mb-4" style={{ color: '#a8a296' }}>
                  Acesse o CRM diretamente pelo ícone na tela inicial, sem abrir o navegador.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={dismiss}
                    className="flex-1 py-3.5 rounded-2xl text-sm font-medium"
                    style={{ background: '#161518', color: '#6e6a60' }}
                  >
                    Agora não
                  </button>
                  <button
                    onClick={install}
                    className="flex-1 py-3.5 rounded-full text-sm font-semibold"
                    style={{ background: '#e8b84b', color: '#09090a' }}
                  >
                    Instalar
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* Close X */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-lg"
          style={{ color: '#6e6a60', background: '#161518' }}
        >
          ✕
        </button>
      </div>
    </>
  )
}
