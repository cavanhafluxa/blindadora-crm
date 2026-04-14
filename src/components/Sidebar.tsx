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
    <aside className="sidebar w-64 flex-shrink-0 flex flex-col pt-6 pb-4 px-4 overflow-hidden relative h-[calc(100vh-3rem)]">
      {/* Logo Area */}
      <div className="flex items-center gap-3 px-2 mb-6">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
        <span className="text-[var(--color-foreground)] font-bold text-lg tracking-tight">PROBlind</span>
      </div>

      {/* User Status Block */}
      <div className="soft-card p-4 rounded-2xl mb-6 bg-gradient-to-b from-[var(--color-card-bg)] to-transparent relative">
        <div className="flex justify-between items-start mb-3">
          {!userName ? (
            <div className="w-10 h-10 rounded-full bg-[var(--color-sidebar-border)] animate-pulse" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-400 border-2 border-[var(--color-card-border)] flex items-center justify-center text-sm font-bold text-white shadow-md">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-full hover:bg-[var(--color-sidebar-hover)] transition-colors text-[var(--color-sidebar-text)]"
            title="Alternar Tema"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
        
        <div className="flex flex-col">
          <span className="text-[9px] font-bold tracking-widest text-[var(--color-sidebar-text)] uppercase mb-1">{currentDate}</span>
          <span className="text-xl font-bold text-[var(--color-foreground)] leading-tight tracking-tight">Bem-vindo,<br/>{userName ? userName.split(' ')[0] : '...'}!</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-7 overflow-y-auto custom-scrollbar pr-2 mb-4">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="px-2 mb-3 text-[10px] font-extrabold text-[var(--color-sidebar-text)] opacity-70 uppercase tracking-widest">{section.title}</div>
            <div className="space-y-1">
              {section.links.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                return (
                  <Link
                    key={href}
                    href={href}
                    prefetch={true}
                    className={`sidebar-link group ${isActive ? 'active' : ''}`}
                  >
                    <Icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-sidebar-text)] group-hover:text-[var(--color-foreground)]'}`} />
                    <span className="font-semibold">{label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* CTA Bottom Area */}
      <div className="mt-auto px-1 flex flex-col gap-3">
        <button className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 transition-all text-white p-4 rounded-2xl flex flex-col items-start shadow-xl shadow-blue-500/20 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-xl group-hover:opacity-10 transition-opacity"></div>
          <div className="flex items-center gap-2 font-bold text-sm mb-1 z-10">
            <Sparkles className="w-4 h-4 text-blue-200" />
            Planos & Assinaturas
          </div>
          <span className="text-xs text-blue-200 font-medium z-10">Gerenciar recursos VIP</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-red-500/80 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Desconectar
        </button>
      </div>
    </aside>
  )
}
