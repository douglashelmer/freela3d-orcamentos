import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Freela3D — Orçamentos',
  description: 'Plataforma de orçamentos Freela3D.pro',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-bg text-text antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#252525', color: '#fff', border: '1px solid #333' },
            success: { iconTheme: { primary: '#D5FF40', secondary: '#1E1E1E' } },
          }}
        />
      </body>
    </html>
  )
}
