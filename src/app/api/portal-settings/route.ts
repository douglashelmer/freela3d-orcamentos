import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export const DEFAULT_PORTAL_SETTINGS = {
  logo: null as string | null,
  favicon: null as string | null,
  primaryColor: '#e8b84b',
  secondaryColor: '#a3e635',
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const rows = await db.$queryRaw<Array<{ portalSettings: string | null }>>`
      SELECT "portalSettings" FROM "User" WHERE id = ${session.user.id} LIMIT 1
    `
    const raw = rows[0]?.portalSettings
    return NextResponse.json(raw ? { ...DEFAULT_PORTAL_SETTINGS, ...JSON.parse(raw) } : DEFAULT_PORTAL_SETTINGS)
  } catch {
    return NextResponse.json(DEFAULT_PORTAL_SETTINGS)
  }
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  try {
    await db.$executeRaw`
      UPDATE "User" SET "portalSettings" = ${JSON.stringify(body)} WHERE id = ${session.user.id}
    `
  } catch {
    return NextResponse.json({ error: 'Coluna portalSettings não existe. Rode migration_v12.sql.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
