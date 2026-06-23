import { QuoteBuilder } from '@/components/builder/QuoteBuilder'

export default function NovoOrcamentoPage() {
  return (
    <div className="h-full flex flex-col" style={{ background: '#1E1E1E' }}>
      <div className="px-8 py-4 border-b flex items-center gap-2 text-sm" style={{ borderColor: '#2a2a2a' }}>
        <a href="/admin/orcamentos" className="text-[#666] hover:text-white transition-colors">Orçamentos</a>
        <span className="text-[#444]">/</span>
        <span className="text-white">Novo orçamento</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <QuoteBuilder />
      </div>
    </div>
  )
}
