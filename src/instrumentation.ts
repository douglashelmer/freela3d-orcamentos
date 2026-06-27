export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startAgendaReminders } = await import('./lib/agenda-reminders')
    startAgendaReminders()
  }
}
