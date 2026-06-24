import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { applyShortcodes } from '@/lib/contracts'
import { nanoid } from 'nanoid'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const contracts = await db.$queryRaw<Array<{
      id: string; clientName: string; projectName: string;
      totalValue: number; finalValue: number; createdAt: Date
    }>>`
      SELECT id, "clientName", "projectName", "totalValue", "finalValue", "createdAt"
      FROM "Contract"
      WHERE "userId" = ${session.user.id}
      ORDER BY "createdAt" DESC
    `
    return NextResponse.json(contracts)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Fetch user data for shortcodes
  const userRows = await db.$queryRaw<Array<{
    name: string; company: string | null; address: string | null;
    neighborhood: string | null; city: string | null; state: string | null; document: string | null
  }>>`
    SELECT name, company, address, neighborhood, city, state, document
    FROM "User" WHERE id = ${session.user.id} LIMIT 1
  `
  const user = userRows[0]
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Fetch template content
  let templateContent = body.templateContent as string
  if (!templateContent && body.templateId) {
    try {
      const tRows = await db.$queryRaw<Array<{ content: string }>>`
        SELECT content FROM "ContractTemplate"
        WHERE id = ${body.templateId} AND "userId" = ${session.user.id} LIMIT 1
      `
      templateContent = tRows[0]?.content ?? ''
    } catch {
      templateContent = ''
    }
  }

  const contractData = {
    clientName: body.clientName,
    clientDocument: body.clientDocument,
    clientRepresentative: body.clientRepresentative,
    clientAddress: body.clientAddress,
    clientAddressNumber: body.clientAddressNumber,
    clientNeighborhood: body.clientNeighborhood,
    clientCity: body.clientCity,
    clientState: body.clientState,
    projectName: body.projectName,
    services: body.services,
    duration: body.duration || '90 dias a partir da assinatura',
    totalValue: Number(body.totalValue) || 0,
    discount: Number(body.discount) || 0,
    finalValue: Number(body.finalValue) || 0,
    installments: Number(body.installments) || 1,
    paymentMethod: body.paymentMethod || 'PIX',
    paymentConditions: body.paymentConditions || 'À vista',
  }

  const generatedContent = applyShortcodes(templateContent, { user, contract: contractData })

  const id = nanoid()
  const now = new Date()

  try {
    await db.$executeRaw`
      INSERT INTO "Contract" (
        id, "userId", "templateId", "clientName", "clientDocument", "clientRepresentative",
        "clientEmail", "clientPhone", "clientAddress", "clientAddressNumber", "clientNeighborhood",
        "clientCity", "clientState", "projectName", services, duration,
        "totalValue", discount, "finalValue", installments, "paymentMethod", "paymentConditions",
        "generatedContent", "createdAt", "updatedAt"
      ) VALUES (
        ${id}, ${session.user.id}, ${body.templateId ?? null}, ${contractData.clientName},
        ${contractData.clientDocument ?? null}, ${contractData.clientRepresentative ?? null},
        ${body.clientEmail ?? null}, ${body.clientPhone ?? null},
        ${contractData.clientAddress ?? null}, ${contractData.clientAddressNumber ?? null},
        ${contractData.clientNeighborhood ?? null}, ${contractData.clientCity ?? null},
        ${contractData.clientState ?? null}, ${contractData.projectName},
        ${contractData.services ?? null}, ${contractData.duration},
        ${contractData.totalValue}, ${contractData.discount}, ${contractData.finalValue},
        ${contractData.installments}, ${contractData.paymentMethod}, ${contractData.paymentConditions},
        ${generatedContent}, ${now}, ${now}
      )
    `
    return NextResponse.json({ id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao gerar contrato' }, { status: 500 })
  }
}
