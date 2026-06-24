import { auth } from '@/auth'
import { db } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ContractViewer } from './ContractViewer'
import { PrintButton } from './PrintButton'

export default async function ContratoViewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params

  let contract: {
    id: string; clientName: string; projectName: string; generatedContent: string;
    totalValue: number; finalValue: number; paymentMethod: string; paymentConditions: string;
    installments: number; createdAt: Date
  } | null = null

  try {
    const rows = await db.$queryRaw<Array<{
      id: string; clientName: string; projectName: string; generatedContent: string;
      totalValue: number; finalValue: number; paymentMethod: string; paymentConditions: string;
      installments: number; createdAt: Date
    }>>`
      SELECT id, "clientName", "projectName", "generatedContent",
             "totalValue", "finalValue", "paymentMethod", "paymentConditions",
             installments, "createdAt"
      FROM "Contract"
      WHERE id = ${id} AND "userId" = ${session.user.id}
      LIMIT 1
    `
    contract = rows[0] ?? null
  } catch {
    notFound()
  }

  if (!contract) notFound()

  return (
    <div className="min-h-screen" style={{ background: '#1E1E1E' }}>
      {/* Top bar (hidden on print) */}
      <div className="no-print sticky top-0 z-10 border-b px-6 py-3 flex items-center justify-between" style={{ background: 'rgba(30,30,30,0.95)', borderColor: '#2a2a2a' }}>
        <div className="flex items-center gap-4">
          <Link href="/admin/contratos" className="text-[#888] hover:text-white transition-colors text-sm flex items-center gap-1">
            ← Contratos
          </Link>
          <div className="w-px h-4" style={{ background: '#333' }} />
          <p className="text-sm font-medium text-white">{contract.projectName}</p>
          <span className="text-xs text-[#666]">— {contract.clientName}</span>
        </div>
        <PrintButton />
      </div>

      <ContractViewer contract={{ ...contract, createdAt: contract.createdAt.toISOString() }} />
    </div>
  )
}
