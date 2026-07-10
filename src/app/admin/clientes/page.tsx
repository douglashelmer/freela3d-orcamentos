import { auth } from '@/auth'
import { db } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export default async function ClientesPage() {
  const session = await auth()
  const clients = await db.client.findMany({
    where: { quotes: { some: { userId: session!.user!.id! } } },
    include: { _count: { select: { quotes: true } } },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-white">Clientes</h1>
        <p className="text-[#a8a296] text-sm mt-0.5">{clients.length} cliente{clients.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: '#161518', borderColor: 'rgba(255,255,255,0.1)' }}>
        {clients.length === 0 ? (
          <div className="py-16 text-center text-[#6e6a60]">
            <p className="text-5xl mb-4">◉</p>
            <p>Nenhum cliente cadastrado ainda</p>
            <p className="text-sm mt-1">Os clientes aparecem aqui quando você cria orçamentos</p>
          </div>
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="divide-y md:hidden" style={{ borderColor: '#1c1b1e' }}>
              {clients.map(c => (
                <div key={c.id} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{c.name}</p>
                      {c.company && <p className="text-xs text-[#a8a296]">{c.company}</p>}
                      {c.email && <p className="text-xs text-[#6e6a60] mt-0.5">{c.email}</p>}
                      {c.phone && <p className="text-xs text-[#6e6a60]">{c.phone}</p>}
                    </div>
                    <span className="text-xs font-medium text-[#e8b84b] shrink-0 mt-0.5">
                      {c._count.quotes} orç.
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <table className="hidden md:table w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  {['Nome', 'Email', 'Telefone', 'Empresa', 'Orçamentos'].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-[#6e6a60] px-6 py-3 uppercase tracking-wide font-mono">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#1c1b1e' }}>
                {clients.map(c => (
                  <tr key={c.id} className="hover:bg-[#1c1b1e] transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-white">{c.name}</td>
                    <td className="px-6 py-4 text-sm text-[#a8a296]">{c.email ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-[#a8a296]">{c.phone ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-[#a8a296]">{c.company ?? '—'}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-[#e8b84b]">{c._count.quotes}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  )
}
