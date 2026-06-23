import { auth } from '@/auth'
import SetupWizard from './SetupWizard'

export default async function SetupPage() {
  const session = await auth()
  return (
    <SetupWizard
      userId={session!.user!.id!}
      initialName={session!.user!.name ?? ''}
    />
  )
}
