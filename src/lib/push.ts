import webPush from 'web-push'
import { db } from './db'

export interface PushPayload {
  title: string
  body: string
  url?: string
  icon?: string
}

let vapidReady = false
function initVapid() {
  if (vapidReady) return true
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) return false
  webPush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL ?? 'contato@freela3d.pro'}`,
    pub,
    priv,
  )
  vapidReady = true
  return true
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!initVapid()) return // VAPID keys not configured
  let subs: Array<{ id: string; endpoint: string; p256dh: string; auth: string }> = []
  try {
    subs = await db.$queryRaw`
      SELECT id, endpoint, p256dh, auth FROM "PushSubscription" WHERE "userId" = ${userId}
    `
  } catch {
    return // table not created yet
  }

  if (!subs.length) return

  const notification = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? '/admin',
    icon: payload.icon ?? '/logo.svg',
  })

  const failed: string[] = []

  await Promise.allSettled(
    subs.map(async sub => {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notification,
        )
      } catch (err: any) {
        // 410 Gone = subscription expired, remove it
        if (err?.statusCode === 410) failed.push(sub.id)
      }
    })
  )

  if (failed.length) {
    await db.$executeRaw`
      DELETE FROM "PushSubscription" WHERE id = ANY(${failed}::text[])
    `
  }
}
