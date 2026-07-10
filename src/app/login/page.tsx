'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.error) {
      setError('Email ou senha incorretos')
    } else {
      router.push('/admin')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#09090a' }}>
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <Image src="/logo.svg" alt="Freela3D" width={200} height={50} priority />
        </div>

        <div className="rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#161518] p-8">
          <h1 className="text-xl font-semibold text-white mb-1">Entrar</h1>
          <p className="text-sm text-[#a8a296] mb-6">Acesse sua plataforma de orçamentos</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#a8a296]">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="h-11 rounded-xl bg-[#1c1b1e] border border-[rgba(255,255,255,0.1)] px-4 text-white placeholder-[#6e6a60] focus:outline-none focus:border-[#e8b84b] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#a8a296]">Senha</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11 rounded-xl bg-[#1c1b1e] border border-[rgba(255,255,255,0.1)] px-4 text-white placeholder-[#6e6a60] focus:outline-none focus:border-[#e8b84b] transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-12 rounded-full font-semibold text-[#09090a] transition-colors mt-2 disabled:opacity-50"
              style={{ background: '#e8b84b' }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#6e6a60] mt-6">Freela3D.pro © {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}
