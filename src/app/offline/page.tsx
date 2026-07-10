'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8" style={{ background: '#09090a' }}>
      <div className="text-5xl">📡</div>
      <h1 className="text-xl font-bold text-white">Sem conexão</h1>
      <p className="text-sm text-[#a8a296] text-center">Você está offline. Conecte-se à internet para acessar o Atlaz.</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-6 py-3 rounded-full text-sm font-semibold text-[#09090a]"
        style={{ background: '#e8b84b' }}
      >
        Tentar novamente
      </button>
    </div>
  )
}
