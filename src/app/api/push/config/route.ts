import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''
  return NextResponse.json({ vapidPublicKey: key, configured: !!key })
}
