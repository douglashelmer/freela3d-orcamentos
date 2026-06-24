'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-[#333] text-[#888] hover:text-white hover:border-[#555] transition-all"
    >
      📄 Salvar PDF
    </button>
  )
}
