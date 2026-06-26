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

  type ContractRow = {
    id: string; clientName: string; projectName: string; generatedContent: string;
    totalValue: number; finalValue: number; paymentMethod: string; paymentConditions: string;
    installments: number; createdAt: Date; token: string | null; status: string;
    signedAt: Date | null; signedByName: string | null;
  }

  let contract: ContractRow | null = null

  try {
    const rows = await db.$queryRaw<ContractRow[]>`
      SELECT id, "clientName", "projectName", "generatedContent",
             "totalValue", "finalValue", "paymentMethod", "paymentConditions",
             installments, "createdAt",
             token,
             COALESCE(status, 'DRAFT') as status,
             "signedAt", "signedByName"
      FROM "Contract"
      WHERE id = ${id} AND "userId" = ${session.user.id}
      LIMIT 1
    `
    contract = rows[0] ?? null
  } catch {
    notFound()
  }

  if (!contract) notFound()

  const shareUrl = contract.token
    ? `${process.env.NEXTAUTH_URL ?? 'https://freela3d.pro'}/contrato/${contract.token}`
    : null

  return (
    <div className="min-h-screen" style={{ background: '#1E1E1E' }}>
      {/* Top bar */}
      <div className="no-print sticky top-0 z-10 border-b px-4 md:px-6 py-3 flex items-center justify-between gap-3" style={{ background: 'rgba(30,30,30,0.95)', borderColor: '#2a2a2a' }}>
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/admin/contratos" className="text-[#888] hover:text-white transition-colors text-sm flex items-center gap-1 shrink-0">
            ← Contratos
          </Link>
          <div className="hidden sm:block w-px h-4" style={{ background: '#333' }} />
          <p className="hidden sm:block text-sm font-medium text-white truncate">{contract.projectName}</p>
          {contract.status === 'SIGNED' && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0" style={{ background: '#D5FF4020', color: '#D5FF40' }}>
              ✅ Assinado
            </span>
          )}
          {contract.status === 'SENT' && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0" style={{ background: '#60a5fa20', color: '#60a5fa' }}>
              📤 Enviado
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {shareUrl && contract.status !== 'SIGNED' && (
            <ContractShareButton shareUrl={shareUrl} contractId={id} />
          )}
          <PrintButton />
        </div>
      </div>

      {contract.status === 'SIGNED' && contract.signedByName && (
        <div className="no-print px-6 py-3 text-sm text-center" style={{ background: '#D5FF4015', color: '#D5FF40' }}>
          Assinado por <strong>{contract.signedByName}</strong>
          {contract.signedAt && (
            <> em {new Date(contract.signedAt).toLocaleDateString('pt-BR')}</>
          )}
        </div>
      )}

      <ContractViewer contract={{ ...contract, createdAt: contract.createdAt.toISOString(), signedAt: contract.signedAt?.toISOString() ?? null }} />
    </div>
  )
}

// Server-side share button is actually a client component
import { ContractShareButton } from './ContractShareButton'
