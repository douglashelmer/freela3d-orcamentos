import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export const DEFAULT_PDF_SETTINGS = {
  template: 'modern',
  primaryColor: '#1E1E1E',
  accentColor: '#D5FF40',
  bgMode: 'light',
  bgColor: '#FFFFFF',
  textColor: '#1A1A1A',
  pdfLogo: null as string | null,
  pdfBanner: null as string | null,
  bgImage: null as string | null,
  watermark: '',
  introText: '',
  termsText: '',
  footerText: '',
  blocks: {
    logo: true,
    validity: true,
    notes: true,
    contact: true,
  },
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const rows = await db.$queryRaw<Array<{ pdfSettings: string | null }>>`
      SELECT "pdfSettings" FROM "User" WHERE id = ${session.user.id} LIMIT 1
    `
    const raw = rows[0]?.pdfSettings
    return NextResponse.json(raw ? { ...DEFAULT_PDF_SETTINGS, ...JSON.parse(raw) } : DEFAULT_PDF_SETTINGS)
  } catch {
    return NextResponse.json(DEFAULT_PDF_SETTINGS)
  }
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  try {
    await db.$executeRaw`
      UPDATE "User" SET "pdfSettings" = ${JSON.stringify(body)} WHERE id = ${session.user.id}
    `
  } catch {
    return NextResponse.json({ error: 'Coluna pdfSettings não existe. Rode migration_v9.sql.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
