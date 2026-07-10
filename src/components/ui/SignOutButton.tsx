'use client'

import { signOut } from 'next-auth/react'

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[#6e6a60] hover:text-red-400 hover:bg-red-900/10 transition-all"
    >
      <span>⎋</span> Sair
    </button>
  )
}
