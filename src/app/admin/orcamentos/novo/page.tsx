import { QuoteBuilder } from '@/components/builder/QuoteBuilder'

export default function NovoOrcamentoPage() {
  return (
    <div className="h-full flex flex-col" style={{ background: '#09090a' }}>
      <div className="px-8 py-4 border-b flex items-center gap-2 text-sm" style={{ borderColor: '#1c1b1e' }}>
        <a href="/admin/orcamentos" className="text-[#6e6a60] hover:text-white transition-colors">Orçamentos</a>
        <span className="text-[rgba(255,255,255,0.16)]">/</span>
        <span className="text-white">Novo orçamento</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <QuoteBuilder />
      </div>
    </div>
  )
}
