import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { name, content, isDefault } = body
  const now = new Date()

  try {
    if (isDefault) {
      await db.$executeRaw`
        UPDATE "ContractTemplate" SET "isDefault" = false WHERE "userId" = ${session.user.id}
      `
    }
    await db.$executeRaw`
      UPDATE "ContractTemplate"
      SET name = ${name}, content = ${content}, "isDefault" = ${!!isDefault}, "updatedAt" = ${now}
      WHERE id = ${id} AND "userId" = ${session.user.id}
    `
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao atualizar modelo' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    await db.$executeRaw`
      DELETE FROM "ContractTemplate" WHERE id = ${id} AND "userId" = ${session.user.id}
    `
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao deletar modelo' }, { status: 500 })
  }
}
