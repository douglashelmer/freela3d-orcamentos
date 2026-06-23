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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#1E1E1E' }}>
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <Image src="/logo.svg" alt="Freela3D" width={200} height={50} priority />
        </div>

        <div className="rounded-2xl border border-[#333] bg-[#252525] p-8">
          <h1 className="text-xl font-semibold text-white mb-1">Entrar</h1>
          <p className="text-sm text-[#888] mb-6">Acesse sua plataforma de orçamentos</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#ccc]">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="h-11 rounded-xl bg-[#2a2a2a] border border-[#333] px-4 text-white placeholder-[#555] focus:outline-none focus:border-[#D5FF40] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#ccc]">Senha</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11 rounded-xl bg-[#2a2a2a] border border-[#333] px-4 text-white placeholder-[#555] focus:outline-none focus:border-[#D5FF40] transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-12 rounded-xl font-semibold text-[#1E1E1E] transition-colors mt-2 disabled:opacity-50"
              style={{ background: '#D5FF40' }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#555] mt-6">Freela3D.pro © {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}
