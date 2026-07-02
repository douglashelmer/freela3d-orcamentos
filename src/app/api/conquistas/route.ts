import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  // Total revenue from paid transactions (INCOME + PAID)
  const totalRows = await db.$queryRaw<Array<{ total: number }>>`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM "Transaction"
    WHERE "userId" = ${userId} AND type = 'INCOME' AND status = 'PAID'
  `
  const total = Number(totalRows[0]?.total ?? 0)

  // Monthly revenue — last 12 months
  const monthlyRows = await db.$queryRaw<Array<{ month: string; amount: number }>>`
    SELECT
      TO_CHAR("paidAt", 'YYYY-MM') as month,
      COALESCE(SUM(amount), 0) as amount
    FROM "Transaction"
    WHERE "userId" = ${userId}
      AND type = 'INCOME'
      AND status = 'PAID'
      AND "paidAt" >= NOW() - INTERVAL '12 months'
    GROUP BY TO_CHAR("paidAt", 'YYYY-MM')
    ORDER BY month ASC
  `

  // Build full 12-month list (fill gaps with 0)
  const nowParts = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }).split('-').map(Number)
  const months: Array<{ month: string; label: string; amount: number }> = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(nowParts[0], nowParts[1] - 1 - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('. de ', '/').replace('.', '')
    const found = monthlyRows.find(r => r.month === key)
    months.push({ month: key, label, amount: Number(found?.amount ?? 0) })
  }

  return NextResponse.json({ total, monthly: months })
}
