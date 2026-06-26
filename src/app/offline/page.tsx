'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8" style={{ background: '#1E1E1E' }}>
      <div className="text-5xl">📡</div>
      <h1 className="text-xl font-bold text-white">Sem conexão</h1>
      <p className="text-sm text-[#888] text-center">Você está offline. Conecte-se à internet para acessar o Freela3D.</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-6 py-3 rounded-xl text-sm font-semibold text-[#1E1E1E]"
        style={{ background: '#D5FF40' }}
      >
        Tentar novamente
      </button>
    </div>
  )
}
