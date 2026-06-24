import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

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
    if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(rows[0])
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao buscar contrato' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    await db.$executeRaw`
      DELETE FROM "Contract" WHERE id = ${id} AND "userId" = ${session.user.id}
    `
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao deletar contrato' }, { status: 500 })
  }
}
