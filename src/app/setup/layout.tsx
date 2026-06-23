import { auth } from '@/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'

export default async function SetupLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingCompleted: true },
  })
  if (user?.onboardingCompleted) redirect('/admin')

  return <>{children}</>
}
