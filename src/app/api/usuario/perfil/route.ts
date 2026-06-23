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

  return NextResponse.json(user)
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

  return NextResponse.json(user)
}
