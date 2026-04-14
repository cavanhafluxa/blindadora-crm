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
  Sun,
  Sparkles
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

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).toUpperCase()

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col pt-8 pb-6 px-6 bg-[var(--color-sidebar-bg)] border-r border-[var(--color-sidebar-border)] z-50 h-[calc(100vh-2rem)] rounded-3xl relative mx-2 my-4 shadow-xl">
      {/* Logo Area */}
      <div className="flex items-center gap-3 mb-10 pl-2">
        <div className="w-8 h-8 rounded-full bg-black dark:bg-white flex items-center justify-center flex-shrink-0 group cursor-pointer transition-transform hover:scale-105">
          <ShieldCheck className="w-4 h-4 text-white dark:text-black" />
        </div>
        <span className="text-[var(--color-foreground)] font-bold text-xl tracking-tight">Equa CRM</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 w-full space-y-8 flex flex-col overflow-y-auto custom-scrollbar">
        {sections.map((section) => (
          <div key={section.title} className="w-full flex flex-col gap-2">
            <span className="text-[10px] font-bold text-[var(--color-sidebar-text)] uppercase tracking-widest pl-2 mb-1 opacity-70">
              {section.title}
            </span>
            <div className="flex flex-col gap-1">
              {section.links.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                return (
                  <Link
                    key={href}
                    href={href}
                    prefetch={true}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 group ${isActive ? 'bg-[var(--color-sidebar-active)] text-white dark:text-black shadow-md' : 'text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)] hover:text-[var(--color-foreground)]'}`}
                  >
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white dark:text-black' : 'text-[var(--color-sidebar-text)] group-hover:text-[var(--color-foreground)]'}`} strokeWidth={isActive ? 2 : 1.5} />
                    <span className="text-sm font-semibold tracking-wide">{label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Area (Theme & User) */}
      <div className="mt-6 pt-6 border-t border-[var(--color-sidebar-border)] w-full flex flex-col gap-2">
        
        <div className="flex items-center justify-between px-2 mb-4">
          {!userName ? (
            <div className="w-8 h-8 rounded-full bg-[var(--color-sidebar-border)] animate-pulse" />
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-[var(--color-foreground)] shadow-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-bold text-[var(--color-foreground)] truncate max-w-[100px]">{userName.split(' ')[0]}</span>
            </div>
          )}
          
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-sidebar-hover)] transition-colors text-[var(--color-sidebar-text)] hover:text-[var(--color-foreground)]"
            title="Alternar Tema"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" strokeWidth={1.5} /> : <Moon className="w-4 h-4" strokeWidth={1.5} />}
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-2xl transition-all duration-300 text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)] hover:text-red-500 w-full"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.5} />
          <span className="text-sm font-semibold tracking-wide">Logout</span>
        </button>
      </div>
    </aside>
  )
}
