import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sendPushToUser } from '@/lib/push'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await sendPushToUser(session.user.id, {
      title: '🔔 Notificação de teste',
      body: 'As notificações push estão funcionando!',
      url: '/admin/configuracoes',
    })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Erro' }, { status: 500 })
  }
}
