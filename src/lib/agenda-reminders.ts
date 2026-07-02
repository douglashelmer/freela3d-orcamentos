import { db } from './db'
import { sendPushToUser } from './push'
import { BR_TZ } from './tz'

function formatTime(date: Date) {
  return date.toLocaleTimeString('pt-BR', { timeZone: BR_TZ, hour: '2-digit', minute: '2-digit' })
}

function formatDate(date: Date) {
  return date.toLocaleDateString('pt-BR', { timeZone: BR_TZ, day: '2-digit', month: '2-digit' })
}

async function markAndCheck(entityId: string, type: string): Promise<boolean> {
  try {
    await db.$executeRaw`
      INSERT INTO "ReminderSent" (id, "entityId", type, "sentAt")
      VALUES (gen_random_uuid()::text, ${entityId}, ${type}, NOW())
      ON CONFLICT ("entityId", type) DO NOTHING
    `
    const row = await db.reminderSent.findUnique({
      where: { entityId_type: { entityId, type } },
      select: { sentAt: true },
    })
    // Only newly inserted rows are within 5s of now
    return !!row && Date.now() - row.sentAt.getTime() < 5000
  } catch {
    return false
  }
}

async function checkAppointmentReminders() {
  const now = new Date()
  const windows = [
    { label: '30min', minMs: 28 * 60_000, maxMs: 32 * 60_000, text: '30 minutos' },
    { label: '10min', minMs: 8 * 60_000, maxMs: 12 * 60_000, text: '10 minutos' },
  ]

  for (const { label, minMs, maxMs, text } of windows) {
    const from = new Date(now.getTime() + minMs)
    const to = new Date(now.getTime() + maxMs)

    const appts = await db.appointment.findMany({
      where: { startAt: { gte: from, lte: to }, allDay: false },
      select: { id: true, userId: true, title: true, startAt: true, location: true },
    })

    for (const appt of appts) {
      const fresh = await markAndCheck(appt.id, label)
      if (!fresh) continue
      const body = appt.location
        ? `${formatTime(appt.startAt)} — ${appt.location}`
        : formatTime(appt.startAt)
      await sendPushToUser(appt.userId, {
        title: `⏰ ${appt.title} em ${text}`,
        body,
        url: '/admin/agenda',
      })
    }
  }
}

async function checkTaskDeadlines() {
  const now = new Date()
  const windows = [
    { label: 'task-24h', minMs: 23 * 3600_000, maxMs: 25 * 3600_000, text: '24 horas' },
    { label: 'task-1h', minMs: 50 * 60_000, maxMs: 70 * 60_000, text: '1 hora' },
  ]

  for (const { label, minMs, maxMs, text } of windows) {
    const from = new Date(now.getTime() + minMs)
    const to = new Date(now.getTime() + maxMs)

    const tasks = await db.task.findMany({
      where: {
        dueDate: { gte: from, lte: to },
        column: { not: 'DONE' },
      },
      select: { id: true, userId: true, title: true, dueDate: true },
    })

    for (const task of tasks) {
      const fresh = await markAndCheck(task.id, label)
      if (!fresh) continue
      await sendPushToUser(task.userId, {
        title: `⚠️ Tarefa vence em ${text}`,
        body: task.title,
        url: '/admin/tarefas',
      })
    }
  }
}

async function tick() {
  await Promise.allSettled([checkAppointmentReminders(), checkTaskDeadlines()])
}

let started = false

export function startAgendaReminders() {
  if (started) return
  started = true
  setTimeout(() => {
    tick()
    setInterval(tick, 60_000)
  }, 30_000)
}
