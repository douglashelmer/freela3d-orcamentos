import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sendPushToUser } from '@/lib/push'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const values = [3500, 4800, 9300]
  const value = values[Math.floor(Math.random() * values.length)]
  const formatted = value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  try {
    await sendPushToUser(session.user.id, {
      title: 'Orçamento Aprovado!',
      body: `Proposta de ${formatted} foi assinada pelo cliente`,
      url: '/admin/orcamentos',
    })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Erro' }, { status: 500 })
  }
}
