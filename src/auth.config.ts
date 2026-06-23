import type { NextAuthConfig } from 'next-auth'

// Edge-compatible config — no DB imports here
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
      if (isAdminRoute && !isLoggedIn) return false
      return true
    },
  },
}
