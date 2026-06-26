import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendPushToUser } from '@/lib/push'

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { signedByName, clientSignature } = await req.json()

  if (!signedByName || !clientSignature) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Find contract by token
  const rows = await db.$queryRaw<Array<{
    id: string; userId: string; clientName: string; projectName: string; status: string
  }>>`
    SELECT id, "userId", "clientName", "projectName", status
    FROM "Contract" WHERE token = ${token} LIMIT 1
  `
  const contract = rows[0]
  if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (contract.status === 'SIGNED') return NextResponse.json({ error: 'Already signed' }, { status: 400 })

  await db.$executeRaw`
    UPDATE "Contract"
    SET status = 'SIGNED', "signedAt" = NOW(), "signedByName" = ${signedByName}, "clientSignature" = ${clientSignature}
    WHERE token = ${token}
  `

  sendPushToUser(contract.userId, {
    title: '📝 Contrato assinado!',
    body: `${contract.projectName} foi assinado por ${signedByName}`,
    url: '/admin/contratos',
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const rows = await db.$queryRaw<Array<{
    clientName: string; projectName: string; generatedContent: string;
    finalValue: number; status: string; signedAt: Date | null; signedByName: string | null
  }>>`
    SELECT "clientName", "projectName", "generatedContent", "finalValue", status, "signedAt", "signedByName"
    FROM "Contract" WHERE token = ${token} LIMIT 1
  `
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(rows[0])
}
