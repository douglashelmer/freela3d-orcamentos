'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

type BriefingInfo = {
  token: string
  type: string
  clientName: string
  status: string
  user: { name: string; company: string | null; logo: string | null }
}

const QUESTIONS = [
  { key: 'projectType', label: 'Qual tipo de projeto?', hint: 'Descreva o tipo de projeto', required: true, multiline: false },
  { key: 'description', label: 'Descreva detalhadamente o que precisa', hint: 'Quanto mais detalhes, melhor!', required: true, multiline: true },
  { key: 'references', label: 'Referências visuais', hint: 'Links ou descrições de referências', required: false, multiline: true },
  { key: 'deadline', label: 'Prazo esperado', hint: 'Ex: 15 dias', required: false, multiline: false },
  { key: 'budget', label: 'Orçamento disponível', hint: 'Faixa de investimento', required: false, multiline: false },
]

export default function BriefingPage() {
  const { token } = useParams<{ token: string }>()
  const [info, setInfo] = useState<BriefingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/b/${token}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) { setNotFound(true); setLoading(false); return }
        setInfo(d)
        if (d.status === 'RESPONDED') setDone(true)
        setLoading(false)
      })
  }, [token])

  async function submit() {
    setSubmitting(true)
    await fetch(`/api/b/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answers),
    })
    setDone(true)
    setSubmitting(false)
  }

  const q = QUESTIONS[step]
  const progress = Math.round(((step + 1) / QUESTIONS.length) * 100)
  const canNext = !q?.required || !!answers[q.key]?.trim()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0f11' }}>
      <div className="w-8 h-8 rounded-full border-2 border-[#e8b84b] border-t-transparent animate-spin" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0f11' }}>
      <div className="text-center">
        <p className="text-4xl mb-4">404</p>
        <p className="text-[#6e6a60]">Briefing não encontrado ou link inválido.</p>
      </div>
    </div>
  )

  if (!info) return null

  const displayName = info.user.company || info.user.name

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f0f11', color: '#f5f1e8' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b" style={{ borderColor: '#0f0f11' }}>
        <div className="font-bold text-white text-lg">{displayName}</div>
        <div className="text-right">
          <p className="text-sm font-medium text-white">{info.clientName}</p>
          <p className="text-xs text-[#6e6a60]">{info.type === 'OTHER' ? 'Outro' : info.type.replace('_', ' ')}</p>
        </div>
      </header>

      {done ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: '#e8b84b22', border: '2px solid #e8b84b' }}>
              <span className="text-3xl">✓</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Briefing enviado!</h1>
            <p className="text-[#a8a296]">Obrigado, {info.clientName}. Recebemos suas informações e entraremos em contato em breve.</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col max-w-xl mx-auto w-full px-4 py-8">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#a8a296]">Pergunta {step + 1} de {QUESTIONS.length}</span>
              <span className="text-[#a8a296]">{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: '#0f0f11' }}>
              <div className="h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: '#e8b84b' }} />
            </div>
          </div>

          {/* Question */}
          <div className="flex-1">
            <div className="rounded-2xl p-6" style={{ background: '#0f0f11', border: '1px solid #161518' }}>
              <h2 className="text-lg font-bold text-white mb-1">
                {q.label} {q.required && <span className="text-[#e8b84b]">*</span>}
              </h2>
              <p className="text-sm text-[#6e6a60] mb-4">{q.hint}</p>
              {q.multiline ? (
                <textarea
                  autoFocus
                  value={answers[q.key] ?? ''}
                  onChange={e => setAnswers(a => ({ ...a, [q.key]: e.target.value }))}
                  placeholder={q.hint}
                  rows={5}
                  className="w-full rounded-xl p-4 text-sm text-white placeholder-[rgba(255,255,255,0.16)] outline-none focus:ring-2 focus:ring-[#e8b84b] resize-none transition-all"
                  style={{ background: '#161518', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              ) : (
                <input
                  autoFocus
                  value={answers[q.key] ?? ''}
                  onChange={e => setAnswers(a => ({ ...a, [q.key]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && canNext && step < QUESTIONS.length - 1 && setStep(s => s + 1)}
                  placeholder={q.hint}
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-[rgba(255,255,255,0.16)] outline-none focus:ring-2 focus:ring-[#e8b84b] transition-all"
                  style={{ background: '#161518', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
              className="flex items-center gap-2 text-sm text-[#6e6a60] hover:text-white disabled:opacity-30 transition-colors"
            >
              ← Anterior
            </button>

            {step < QUESTIONS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext}
                className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all disabled:opacity-40 hover:opacity-90"
                style={{ background: '#e8b84b', color: '#0f0f11' }}
              >
                Próxima →
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={!canNext || submitting}
                className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all disabled:opacity-40 hover:opacity-90"
                style={{ background: '#e8b84b', color: '#0f0f11' }}
              >
                {submitting ? 'Enviando…' : '✉ Enviar Briefing'}
              </button>
            )}
          </div>
        </div>
      )}

      <footer className="text-center py-4 text-xs text-[rgba(255,255,255,0.1)]">
        Powered by Atlaz
      </footer>
    </div>
  )
}
