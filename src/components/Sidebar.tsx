'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Kanban,
  Car,
  Package,
  Wallet,
  Wrench,
  Settings,
  ShieldCheck,
  LogOut,
  FileText,
  Users
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/projects', label: 'Projetos', icon: Car },
  { href: '/team', label: 'Colaboradores', icon: Users },
  { href: '/audit', label: 'Histórico', icon: FileText },
  { href: '/proposals', label: 'Propostas', icon: FileText },
  { href: '/financial', label: 'Financeiro', icon: Wallet },
  { href: '/materials', label: 'Estoque', icon: Package },
  { href: '/maintenance', label: 'Pós-Venda', icon: Wrench },
  { href: '/settings', label: 'Configurações', icon: Settings },
]


export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="sidebar flex flex-col py-6 px-3">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 mb-8">
        <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-bold text-base">PROBlind</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="sidebar-link w-full text-left mt-4 border-t border-gray-800 pt-4"
      >
        <LogOut className="w-4 h-4 flex-shrink-0" />
        <span>Sair</span>
      </button>
    </aside>
  )
}
