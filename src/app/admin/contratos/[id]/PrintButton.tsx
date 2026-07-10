'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-[rgba(255,255,255,0.1)] text-[#a8a296] hover:text-white hover:border-[#6e6a60] transition-all"
    >
      📄 Salvar PDF
    </button>
  )
}
