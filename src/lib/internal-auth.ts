import { db } from './db'

let cachedUserId: string | null = null

export async function resolveInternalUser(req: Request): Promise<string | null> {
  const key = req.headers.get('x-internal-key')
  if (!key || key !== process.env.INTERNAL_API_KEY) return null
  if (cachedUserId) return cachedUserId
  const user = await db.user.findFirst({
    where: { email: 'douglashelmmer@gmail.com' },
    select: { id: true },
  })
  if (user) cachedUserId = user.id
  return cachedUserId ?? null
}
