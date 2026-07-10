import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { PwaRegister } from '@/components/ui/PwaRegister'
import { PwaInstallPrompt } from '@/components/ui/PwaInstallPrompt'
import './globals.css'

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] })
const spaceGrotesk = Space_Grotesk({ variable: '--font-space-grotesk', weight: ['500', '600', '700'], subsets: ['latin'] })
const jetbrainsMono = JetBrains_Mono({ variable: '--font-jbmono', weight: ['400', '500'], subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Atlaz',
  description: 'Gestão completa para freelancers 3D',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Atlaz',
  },
  icons: {
    icon: '/icon-atlaz.png',
    apple: '/icon-atlaz.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#09090a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full`}>
      <body className="min-h-full bg-bg text-text antialiased font-sans">
        <PwaRegister />
        <PwaInstallPrompt />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#161518', color: '#f5f1e8', border: '1px solid rgba(255,255,255,0.1)' },
            success: { iconTheme: { primary: '#e8b84b', secondary: '#09090a' } },
          }}
        />
      </body>
    </html>
  )
}
