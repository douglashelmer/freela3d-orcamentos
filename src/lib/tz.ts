// App is Brazil-only; America/Sao_Paulo has used a fixed UTC-3 offset with no DST since 2019.
export const BR_TZ = 'America/Sao_Paulo'
export const BR_OFFSET = '-03:00'

// Builds an unambiguous ISO string from a <input type="date"> + <input type="time"> pair,
// so `new Date(...)` gives the same absolute instant no matter the server's local timezone.
export function brDateTimeToISO(date: string, time: string) {
  return `${date}T${time}:00${BR_OFFSET}`
}

// YYYY-MM-DD in Brasília time, for a stored UTC ISO timestamp.
export function brDateKey(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: BR_TZ })
}

// HH:mm in Brasília time, for a stored UTC ISO timestamp.
export function brTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { timeZone: BR_TZ, hour: '2-digit', minute: '2-digit' })
}
