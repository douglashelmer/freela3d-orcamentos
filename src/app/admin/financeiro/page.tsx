export default function FinanceiroPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Financeiro</h1>
      <p className="text-[#666] text-sm mb-8">Integração com ASAAS — em breve</p>

      <div className="rounded-2xl border p-8 text-center" style={{ background: '#252525', borderColor: '#333' }}>
        <p className="text-4xl mb-4">◈</p>
        <p className="text-lg font-medium text-white mb-2">Integração ASAAS</p>
        <p className="text-sm text-[#666] max-w-sm mx-auto">
          Configure sua conta ASAAS para gerar cobranças (PIX, boleto, cartão) diretamente dos orçamentos aprovados.
        </p>
        <a
          href="https://www.asaas.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#1E1E1E]"
          style={{ background: '#D5FF40' }}
        >
          Criar conta ASAAS
        </a>
      </div>
    </div>
  )
}
