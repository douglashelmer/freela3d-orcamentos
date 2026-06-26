import { db } from './db'
import { sendPushToUser } from './push'

const MILESTONES = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000]

function fmt(n: number) {
  if (n >= 1000000) return `R$ ${n / 1000000}M`
  if (n >= 1000) return `R$ ${n / 1000}k`
  return `R$ ${n}`
}

export async function checkMilestones(userId: string) {
  try {
    // Total revenue (paid income transactions)
    const totalRows = await db.$queryRaw<Array<{ total: number }>>`
      SELECT COALESCE(SUM(amount), 0)::float as total
      FROM "Transaction"
      WHERE "userId" = ${userId} AND type = 'INCOME' AND status = 'PAID'
    `
    const total = totalRows[0]?.total ?? 0

    // Get already notified milestones
    const userRows = await db.$queryRaw<Array<{ milestonesNotified: string | null }>>`
      SELECT "milestonesNotified" FROM "User" WHERE id = ${userId} LIMIT 1
    `
    const notified: number[] = JSON.parse(userRows[0]?.milestonesNotified ?? '[]')

    // Find new milestones crossed
    const newMilestones = MILESTONES.filter(m => total >= m && !notified.includes(m))
    if (!newMilestones.length) return

    // Notify the highest new milestone
    const highest = newMilestones[newMilestones.length - 1]
    await sendPushToUser(userId, {
      title: `🏆 Conquista desbloqueada!`,
      body: `Você atingiu ${fmt(highest)} em faturamento!`,
      url: '/admin',
    })

    // Update stored milestones
    const updated = [...notified, ...newMilestones]
    await db.$executeRaw`
      UPDATE "User" SET "milestonesNotified" = ${JSON.stringify(updated)} WHERE id = ${userId}
    `
  } catch { /* ok — column may not exist yet */ }
}
