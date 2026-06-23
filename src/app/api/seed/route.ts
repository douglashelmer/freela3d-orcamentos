import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  const { email, password, name, secret } = await req.json()
  if (secret !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'User already exists' }, { status: 400 })
  const hashed = await bcrypt.hash(password, 12)
  const user = await db.user.create({ data: { email, password: hashed, name } })
  return NextResponse.json({ id: user.id, email: user.email })
}
