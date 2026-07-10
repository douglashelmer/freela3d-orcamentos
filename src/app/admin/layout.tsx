import { auth } from '@/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { SignOutButton } from '@/components/ui/SignOutButton'
import { MobileAdminNav } from '@/components/ui/MobileAdminNav'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '▦' },
  { href: '/admin/leads', label: 'Leads', icon: '◎' },
  { href: '/admin/agenda', label: 'Agenda', icon: '◷' },
  { href: '/admin/tarefas', label: 'Tarefas', icon: '☑' },
  { href: '/admin/orcamentos', label: 'Orçamentos', icon: '◻' },
  { href: '/admin/contratos', label: 'Contratos', icon: '◪' },
  { href: '/admin/briefings', label: 'Briefings', icon: '◫' },
  { href: '/admin/swipefile', label: 'Swipe File', icon: '⌗' },
  { href: '/admin/clientes', label: 'Clientes', icon: '◉' },
  { href: '/admin/servicos', label: 'Serviços', icon: '◈' },
  { href: '/admin/financeiro', label: 'Financeiro', icon: '◐' },
  { href: '/admin/configuracoes', label: 'Configurações', icon: '⚙' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingCompleted: true, company: true, logo: true, name: true, email: true },
  })
  if (!user) redirect('/login')
  if (!user.onboardingCompleted) redirect('/setup')

  const displayName = user.company || user.name || session.user.name || ''
  const initial = (user.name || session.user.name || 'U')[0].toUpperCase()
  const userName = session.user.name || user.name || ''
  const userEmail = user.email || session.user.email || ''

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#09090a' }}>
      {/* Mobile nav (header + drawer + bottom tabs) */}
      <MobileAdminNav
        logo={user.logo ?? null}
        displayName={displayName}
        initial={initial}
        userName={userName}
        userEmail={userEmail}
      />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r" style={{ background: '#0f0f11', borderColor: '#1c1b1e' }}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor: '#1c1b1e' }}>
          {user.logo ? (
            <img src={user.logo} alt="Logo" className="h-8 object-contain max-w-[140px]" />
          ) : (
            <Image src="/logo.svg" alt="Freela3D" width={140} height={35} />
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#a8a296] hover:text-white hover:bg-[#161518] transition-all"
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t" style={{ borderColor: '#1c1b1e' }}>
          <div className="flex items-center gap-3 px-3 py-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-[#09090a] shrink-0"
              style={{ background: '#e8b84b' }}
            >
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName}</p>
              <p className="text-xs text-[#6e6a60] truncate">{displayName !== userName ? displayName : userEmail}</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Main content — pt-14 on mobile for the top bar, pb-16 for bottom tabs */}
      <main className="flex-1 overflow-y-auto flex flex-col min-h-0 pt-14 md:pt-0 pb-16 md:pb-0">
        {children}
      </main>

    </div>
  )
}
