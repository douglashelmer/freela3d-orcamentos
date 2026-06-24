import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { DEFAULT_CONTRACT_TEMPLATE } from '@/lib/contracts'
import { nanoid } from 'nanoid'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const templates = await db.$queryRaw<Array<{
      id: string; name: string; content: string; isDefault: boolean; createdAt: Date
    }>>`
      SELECT id, name, content, "isDefault", "createdAt"
      FROM "ContractTemplate"
      WHERE "userId" = ${session.user.id}
      ORDER BY "isDefault" DESC, "createdAt" ASC
    `
    return NextResponse.json(templates)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, content, isDefault } = body

  const id = nanoid()
  const now = new Date()

  try {
    if (isDefault) {
      await db.$executeRaw`
        UPDATE "ContractTemplate" SET "isDefault" = false WHERE "userId" = ${session.user.id}
      `
    }
    await db.$executeRaw`
      INSERT INTO "ContractTemplate" (id, "userId", name, content, "isDefault", "createdAt", "updatedAt")
      VALUES (${id}, ${session.user.id}, ${name}, ${content}, ${!!isDefault}, ${now}, ${now})
    `
    return NextResponse.json({ id, name, content, isDefault: !!isDefault, createdAt: now })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao criar modelo' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action } = body

  if (action === 'ensure-default') {
    try {
      const rows = await db.$queryRaw<Array<{ count: string }>>`
        SELECT COUNT(*) as count FROM "ContractTemplate" WHERE "userId" = ${session.user.id}
      `
      const count = parseInt(String(rows[0]?.count ?? '0'))
      if (count === 0) {
        const id = nanoid()
        const now = new Date()
        await db.$executeRaw`
          INSERT INTO "ContractTemplate" (id, "userId", name, content, "isDefault", "createdAt", "updatedAt")
          VALUES (${id}, ${session.user.id}, ${'Template Padrão'}, ${DEFAULT_CONTRACT_TEMPLATE}, true, ${now}, ${now})
        `
        return NextResponse.json({ created: true })
      }
      return NextResponse.json({ created: false })
    } catch {
      return NextResponse.json({ error: 'Tabela não criada' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
