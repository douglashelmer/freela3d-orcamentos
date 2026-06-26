import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { PwaRegister } from '@/components/ui/PwaRegister'
import './globals.css'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Freela3D CRM',
  description: 'Gestão completa para freelancers 3D',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Freela3D',
  },
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1E1E1E',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-bg text-text antialiased">
        <PwaRegister />
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
