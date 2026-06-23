import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, company: true, phone: true,
      logo: true, specialty: true, address: true, neighborhood: true,
      city: true, state: true, zipCode: true, monthlyGoal: true,
      onboardingCompleted: true, googleCalendarConnected: true,
    },
  })

  // new columns — gracefully degrade if migration_v8.sql hasn't run yet
  let extras: { notificationPrefs?: string | null; metaPixelId?: string | null } = {}
  try {
    const row = await db.$queryRaw<Array<{ notificationPrefs: string | null; metaPixelId: string | null }>>`
      SELECT "notificationPrefs", "metaPixelId" FROM "User" WHERE id = ${session.user.id} LIMIT 1
    `
    if (row[0]) extras = row[0]
  } catch { /* columns not yet created */ }

  return NextResponse.json({ ...user, ...extras })
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    name, company, phone, logo, specialty,
    address, neighborhood, city, state, zipCode,
    monthlyGoal, onboardingCompleted,
  } = body

  // core fields — always safe
  const user = await db.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined && { name }),
      ...(company !== undefined && { company }),
      ...(phone !== undefined && { phone }),
      ...(logo !== undefined && { logo }),
      ...(specialty !== undefined && { specialty }),
      ...(address !== undefined && { address }),
      ...(neighborhood !== undefined && { neighborhood }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(zipCode !== undefined && { zipCode }),
      ...(monthlyGoal !== undefined && { monthlyGoal: monthlyGoal ? parseFloat(monthlyGoal) : null }),
      ...(onboardingCompleted !== undefined && { onboardingCompleted }),
    },
    select: { id: true, name: true, email: true, company: true, logo: true },
  })

  // new columns via raw SQL — won't crash if migration hasn't run
  if (body.notificationPrefs !== undefined || body.metaPixelId !== undefined) {
    try {
      if (body.notificationPrefs !== undefined && body.metaPixelId !== undefined) {
        await db.$executeRaw`UPDATE "User" SET "notificationPrefs" = ${body.notificationPrefs}, "metaPixelId" = ${body.metaPixelId} WHERE id = ${session.user.id}`
      } else if (body.notificationPrefs !== undefined) {
        await db.$executeRaw`UPDATE "User" SET "notificationPrefs" = ${body.notificationPrefs} WHERE id = ${session.user.id}`
      } else {
        await db.$executeRaw`UPDATE "User" SET "metaPixelId" = ${body.metaPixelId} WHERE id = ${session.user.id}`
      }
    } catch { /* columns not yet created — silently skip */ }
  }

  return NextResponse.json(user)
}
