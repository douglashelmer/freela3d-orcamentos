import { db } from './db'
import { sendPushToUser } from './push'

let started = false
// In-memory sets to avoid duplicate notifications (reset on server restart)
const sentReminders = new Set<string>() // key: userId:appointmentId:type
const sentDailyDigest = new Map<string, string>() // userId → date string (YYYY-MM-DD)

function todayBRT(): string {
  // Brazil UTC-3
  const now = new Date()
  now.setHours(now.getUTCHours() - 3)
  return now.toISOString().split('T')[0]
}

function hourMinuteBRT(): { h: number; m: number } {
  const now = new Date()
  const h = ((now.getUTCHours() - 3) + 24) % 24
  const m = now.getUTCMinutes()
  return { h, m }
}

async function checkAgendaReminders() {
  const now = new Date()
  const in10 = new Date(now.getTime() + 10 * 60 * 1000)
  const in20 = new Date(now.getTime() + 20 * 60 * 1000)

  let subscriptions: Array<{ userId: string }> = []
  try {
    subscriptions = await db.$queryRaw`
      SELECT DISTINCT "userId" FROM "PushSubscription"
    `
  } catch { return }

  for (const { userId } of subscriptions) {
    // 15-minute reminder for upcoming events
    try {
      const upcoming = await db.$queryRaw<Array<{ id: string; title: string; startAt: Date; location: string | null }>>`
        SELECT id, title, "startAt", location FROM "Appointment"
        WHERE "userId" = ${userId}
          AND "allDay" = false
          AND "startAt" >= ${in10}
          AND "startAt" <= ${in20}
      `
      for (const appt of upcoming) {
        const key = `${userId}:${appt.id}:reminder`
        if (sentReminders.has(key)) continue
        sentReminders.add(key)

        const timeStr = appt.startAt.toLocaleTimeString('pt-BR', {
          hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
        })
        sendPushToUser(userId, {
          title: `⏰ Em 15 minutos: ${appt.title}`,
          body: appt.location ? `${timeStr} · ${appt.location}` : `Às ${timeStr}`,
          url: '/admin/agenda',
        }).catch(() => {})
      }
    } catch { /* table may not exist yet */ }

    // Daily digest at 8am BRT
    const { h, m } = hourMinuteBRT()
    if (h === 8 && m === 0) {
      const today = todayBRT()
      if (sentDailyDigest.get(userId) === today) continue

      try {
        const todayStart = new Date(`${today}T00:00:00-03:00`)
        const todayEnd = new Date(`${today}T23:59:59-03:00`)
        const events = await db.$queryRaw<Array<{ title: string; startAt: Date; allDay: boolean }>>`
          SELECT title, "startAt", "allDay" FROM "Appointment"
          WHERE "userId" = ${userId}
            AND "startAt" >= ${todayStart}
            AND "startAt" <= ${todayEnd}
          ORDER BY "startAt" ASC
        `
        if (events.length > 0) {
          sentDailyDigest.set(userId, today)
          const names = events.slice(0, 3).map(e => {
            if (e.allDay) return e.title
            const t = e.startAt.toLocaleTimeString('pt-BR', {
              hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
            })
            return `${t} ${e.title}`
          }).join(' · ')
          const suffix = events.length > 3 ? ` +${events.length - 3}` : ''
          sendPushToUser(userId, {
            title: `📅 ${events.length} evento${events.length > 1 ? 's' : ''} hoje`,
            body: names + suffix,
            url: '/admin/agenda',
          }).catch(() => {})
        } else {
          sentDailyDigest.set(userId, today)
        }
      } catch { /* ok */ }
    }
  }
}

export function startScheduler() {
  if (started) return
  started = true

  // Cleanup sentReminders daily (clear old entries at midnight)
  const clearOld = () => {
    const today = todayBRT()
    // Keep only today's entries by removing entries that don't match today
    // Simple: just clear everything once a day
    sentReminders.clear()
  }

  setInterval(async () => {
    try {
      await checkAgendaReminders()
    } catch {}
  }, 60 * 1000)

  // Clear reminder cache daily at midnight BRT
  setInterval(() => {
    const { h, m } = hourMinuteBRT()
    if (h === 0 && m === 0) clearOld()
  }, 60 * 1000)

  // Run once shortly after start (delay so DB is ready)
  setTimeout(() => checkAgendaReminders().catch(() => {}), 5000)
}
