'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { SignOutButton } from './SignOutButton'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '▦' },
  { href: '/admin/leads', label: 'Leads', icon: '◎' },
  { href: '/admin/agenda', label: 'Agenda', icon: '◷' },
  { href: '/admin/tarefas', label: 'Tarefas', icon: '☑' },
  { href: '/admin/orcamentos', label: 'Orçamentos', icon: '◻' },
  { href: '/admin/contratos', label: 'Contratos', icon: '◪' },
  { href: '/admin/briefings', label: 'Briefings', icon: '◫' },
  { href: '/admin/clientes', label: 'Clientes', icon: '◉' },
  { href: '/admin/servicos', label: 'Serviços', icon: '◈' },
  { href: '/admin/financeiro', label: 'Financeiro', icon: '◐' },
  { href: '/admin/configuracoes', label: 'Configurações', icon: '⚙' },
]

const BOTTOM_TABS = [
  { href: '/admin', label: 'Dashboard', icon: '▦' },
  { href: '/admin/orcamentos', label: 'Orçamentos', icon: '◻' },
  { href: '/admin/clientes', label: 'Clientes', icon: '◉' },
  { href: '/admin/financeiro', label: 'Financeiro', icon: '◐' },
]

type Props = {
  logo: string | null
  displayName: string
  initial: string
  userName: string
  userEmail: string
}

export function MobileAdminNav({ logo, displayName, initial, userName, userEmail }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  return (
    <>
      {/* Mobile top header */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14"
        style={{ background: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}
      >
        <div className="flex items-center">
          {logo ? (
            <img src={logo} alt="Logo" className="h-7 object-contain max-w-[120px]" />
          ) : (
            <Image src="/logo.svg" alt="Freela3D" width={100} height={28} />
          )}
        </div>
        <button
          onClick={() => setOpen(true)}
          className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-xl"
          style={{ background: '#252525' }}
          aria-label="Menu"
        >
          <span className="block w-5 h-0.5 bg-white rounded-full" />
          <span className="block w-5 h-0.5 bg-white rounded-full" />
          <span className="block w-3 h-0.5 bg-white rounded-full self-start ml-1" />
        </button>
      </header>

      {/* Drawer overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 flex"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-72 h-full flex flex-col"
            style={{ background: '#1a1a1a', borderRight: '1px solid #2a2a2a' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#2a2a2a' }}>
              {logo ? (
                <img src={logo} alt="Logo" className="h-7 object-contain max-w-[120px]" />
              ) : (
                <Image src="/logo.svg" alt="Freela3D" width={100} height={28} />
              )}
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#666] hover:text-white hover:bg-[#252525]"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto">
              {NAV.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive(item.href)
                      ? 'text-white bg-[#252525]'
                      : 'text-[#888] hover:text-white hover:bg-[#252525]'
                  }`}
                >
                  <span className="text-base w-5 text-center">{item.icon}</span>
                  {item.label}
                  {isActive(item.href) && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#D5FF40' }} />
                  )}
                </Link>
              ))}
            </nav>

            {/* User info + sign out */}
            <div className="px-3 py-4 border-t" style={{ borderColor: '#2a2a2a' }}>
              <div className="flex items-center gap-3 px-3 py-2 mb-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-[#1E1E1E] shrink-0"
                  style={{ background: '#D5FF40' }}
                >
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{userName}</p>
                  <p className="text-xs text-[#666] truncate">{displayName !== userName ? displayName : userEmail}</p>
                </div>
              </div>
              <SignOutButton />
            </div>
          </div>

          {/* Dark overlay behind drawer */}
          <div className="flex-1" style={{ background: 'rgba(0,0,0,0.6)' }} />
        </div>
      )}

      {/* Bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex"
        style={{ background: '#1a1a1a', borderTop: '1px solid #2a2a2a' }}
      >
        {BOTTOM_TABS.map(tab => {
          const active = isActive(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-1 text-[10px] font-medium transition-colors"
              style={{ color: active ? '#D5FF40' : '#666' }}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          )
        })}
        {/* Menu button */}
        <button
          onClick={() => setOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-1 text-[10px] font-medium text-[#666]"
        >
          <span className="text-lg leading-none">☰</span>
          <span>Menu</span>
        </button>
      </nav>
    </>
  )
}
