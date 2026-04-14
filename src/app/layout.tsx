import type { Metadata } from 'next'
import { Inter_Tight } from 'next/font/google'
import './globals.css'

const interTight = Inter_Tight({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter-tight',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
})

export const metadata: Metadata = {
  title: 'PROBlind CRM | Sistema de Gestão de Blindagem',
  description: 'Sistema completo para gestão de operações de blindagem automotiva',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={interTight.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
