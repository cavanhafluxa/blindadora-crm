import type { Metadata } from 'next'
import { Sora } from 'next/font/google'
import './globals.css'

const sora = Sora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sora',
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
    <html lang="pt-BR" className={sora.variable}>
      <body className="font-sans text-[14px] antialiased">{children}</body>
    </html>
  )
}
