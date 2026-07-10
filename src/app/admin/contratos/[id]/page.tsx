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
    ? `${process.env.NEXTAUTH_URL ?? 'https://dash.projetoatlaz.com'}/contrato/${contract.token}`
    : null

  return (
    <div className="min-h-screen" style={{ background: '#09090a' }}>
      {/* Top bar */}
      <div className="no-print sticky top-0 z-10 border-b px-4 md:px-6 py-3 flex items-center justify-between gap-3" style={{ background: 'rgba(30,30,30,0.95)', borderColor: '#1c1b1e' }}>
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/admin/contratos" className="text-[#a8a296] hover:text-white transition-colors text-sm flex items-center gap-1 shrink-0">
            ← Contratos
          </Link>
          <div className="hidden sm:block w-px h-4" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <p className="hidden sm:block text-sm font-medium text-white truncate">{contract.projectName}</p>
          {contract.status === 'SIGNED' && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0" style={{ background: '#e8b84b20', color: '#e8b84b' }}>
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
        <div className="no-print px-6 py-3 text-sm text-center" style={{ background: '#e8b84b15', color: '#e8b84b' }}>
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
