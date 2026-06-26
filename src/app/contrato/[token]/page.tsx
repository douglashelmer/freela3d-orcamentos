import { notFound } from 'next/navigation'
import { ContractSignClient } from './ContractSignClient'

export default async function ContratoPublicPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const res = await fetch(
    `${process.env.NEXTAUTH_URL ?? 'http://localhost:3001'}/api/contratos/assinar/${token}`,
    { cache: 'no-store' }
  )
  if (!res.ok) notFound()

  const contract = await res.json()

  return <ContractSignClient contract={contract} token={token} />
}
