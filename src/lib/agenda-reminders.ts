import { db } from './db'
import { sendPushToUser } from './push'

function formatTime(date: Date) {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

async function checkUpcomingEvents() {
  const now = new Date()

  const windows = [
    { label: '30min', minMs: 28 * 60_000, maxMs: 32 * 60_000 },
    { label: '10min', minMs: 8 * 60_000, maxMs: 12 * 60_000 },
  ] as const

  for (const { label, minMs, maxMs } of windows) {
    const from = new Date(now.getTime() + minMs)
    const to = new Date(now.getTime() + maxMs)

    const appointments = await db.appointment.findMany({
      where: { startAt: { gte: from, lte: to }, allDay: false },
      select: { id: true, userId: true, title: true, startAt: true, location: true },
    })

    for (const appt of appointments) {
      try {
        await db.$executeRaw`
          INSERT INTO "ReminderSent" (id, "appointmentId", type, "sentAt")
          VALUES (gen_random_uuid()::text, ${appt.id}, ${label}, NOW())
          ON CONFLICT ("appointmentId", type) DO NOTHING
        `
        const inserted = await db.reminderSent.findUnique({
          where: { appointmentId_type: { appointmentId: appt.id, type: label } },
          select: { sentAt: true },
        })
        // Only send if just inserted (sentAt within last 5s)
        if (!inserted || now.getTime() - inserted.sentAt.getTime() > 5000) continue

        const mins = label === '30min' ? '30' : '10'
        const body = appt.location
          ? `${formatTime(appt.startAt)} — ${appt.location}`
          : formatTime(appt.startAt)

        await sendPushToUser(appt.userId, {
          title: `⏰ ${appt.title} em ${mins} minutos`,
          body,
          url: '/admin/agenda',
        })
      } catch {
        // skip if table doesn't exist yet
      }
    }
  }
}

let started = false

export function startAgendaReminders() {
  if (started) return
  started = true
  // Run once 30s after boot, then every minute
  setTimeout(() => {
    checkUpcomingEvents()
    setInterval(checkUpcomingEvents, 60_000)
  }, 30_000)
}
