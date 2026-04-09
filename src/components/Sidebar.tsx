'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
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
  Users,
  Moon,
  Sun
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

const sections = [
  {
    title: 'Comercial',
    links: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/pipeline', label: 'Pipeline', icon: Kanban },
      { href: '/proposals', label: 'Propostas', icon: FileText },
    ]
  },
  {
    title: 'Produção',
    links: [
      { href: '/projects', label: 'Projetos', icon: Car },
      { href: '/materials', label: 'Estoque', icon: Package },
    ]
  },
  {
    title: 'Gestão',
    links: [
      { href: '/financial', label: 'Financeiro', icon: Wallet },
      { href: '/maintenance', label: 'Pós-Venda', icon: Wrench },
      { href: '/team', label: 'Colaboradores', icon: Users },
      { href: '/audit', label: 'Histórico', icon: FileText },
      { href: '/settings', label: 'Configurações', icon: Settings },
    ]
  }
]

export default function Sidebar({ userEmail, userId }: { userEmail: string; userId: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [theme, setTheme] = useState('light')
  const [userName, setUserName] = useState<string>('')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light'
    setTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)

    // Fetch profile on client to avoid blocking initial shell render
    async function loadProfile() {
      const cacheKey = `user_name_${userId}`
      const cached = localStorage.getItem(cacheKey)
      if (cached) setUserName(cached)

      const { data } = await supabase.from('profiles').select('full_name').eq('id', userId).single()
      if (data?.full_name) {
        setUserName(data.full_name)
        localStorage.setItem(cacheKey, data.full_name)
      } else if (!cached) {
        setUserName(userEmail.split('@')[0])
      }
    }
    loadProfile()
  }, [userId, userEmail, supabase])

  function toggleTheme() {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="sidebar flex flex-col py-6 px-3">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 mb-8">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-bold text-base">PROBlind</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-1">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="px-4 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{section.title}</div>
            <div className="space-y-1">
              {section.links.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                return (
                  <Link
                    key={href}
                    href={href}
                    prefetch={true}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User and Tools Bottom */}
      <div className="mt-6 border-t border-gray-800 pt-4 px-2 space-y-3">
        <button
          onClick={toggleTheme}
          className="sidebar-link w-full text-left"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
        </button>

        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-left text-red-500 hover:text-red-400 hover:bg-gray-800/50"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Sair</span>
        </button>

        <div className="flex items-center gap-3 px-2 pt-2">
          {!userName ? (
            <div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-200 truncate max-w-[120px]">{userName || 'Carregando...'}</span>
            <span className="text-[10px] text-gray-500">Logado</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
