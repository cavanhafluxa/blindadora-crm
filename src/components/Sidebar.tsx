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
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

// ──────────────────────────────────────────────
//  Navigation structure
// ──────────────────────────────────────────────
const navItems = [
  { href: '/dashboard',   label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/pipeline',    label: 'Pipeline',       icon: Kanban },
  { href: '/proposals',   label: 'Propostas',      icon: FileText },
  { href: '/projects',    label: 'Projetos',        icon: Car },
  { href: '/materials',   label: 'Estoque',         icon: Package },
  { href: '/financial',   label: 'Financeiro',      icon: Wallet },
  { href: '/maintenance', label: 'Pós-Venda',       icon: Wrench },
  { href: '/team',        label: 'Colaboradores',   icon: Users },
  { href: '/audit',       label: 'Histórico',       icon: FileText },
  { href: '/settings',    label: 'Configurações',   icon: Settings },
]

const STAGGER = 0.04 // seconds

export default function Sidebar({ userEmail, userId }: { userEmail: string; userId: string }) {
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = createClient()

  const [theme,    setTheme]    = useState('light')
  const [userName, setUserName] = useState<string>('')
  const [orgName,  setOrgName]  = useState<string>('PROblind')
  const [orgLogo,  setOrgLogo]  = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'light'
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)

    async function loadData() {
      const cacheKey = `user_name_${userId}`
      const cached   = localStorage.getItem(cacheKey)
      if (cached) setUserName(cached)

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, organizations(name, logo_url)')
        .eq('id', userId)
        .single()

      if (profile?.full_name) {
        setUserName(profile.full_name)
        localStorage.setItem(cacheKey, profile.full_name)
      } else if (!cached) {
        setUserName(userEmail.split('@')[0])
      }

      if (profile?.organizations) {
        // @ts-ignore - Handle potential array or object return
        const orgData = Array.isArray(profile.organizations) ? profile.organizations[0] : profile.organizations
        
        // Priorizar nome da organização, se não for o padrão, senão usar o do perfil
        const finalName = (orgData?.name && !['PROblind', 'PROBlind'].includes(orgData.name))
          ? orgData.name
          : (profile.full_name || 'PROblind')

        setOrgName(finalName)
        // Fallback para avatar do perfil se a logo da org não estiver definida
        setOrgLogo(orgData?.logo_url || profile.avatar_url)
      }
    }
    loadData()
  }, [userId, userEmail, supabase])

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userName
    ? userName.charAt(0).toUpperCase()
    : userEmail.charAt(0).toUpperCase()

  return (
    <aside
      className="fixed left-4 top-4 bottom-4 z-50 flex flex-col"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        width: expanded ? '216px' : '64px',
        transition: 'width 0.32s cubic-bezier(0.34, 1.2, 0.64, 1)',
      }}
    >
      {/* ── Rectangular dark pill ── */}
      <div
        className="flex flex-col h-full overflow-hidden"
        style={{
          backgroundColor: '#111111',
          borderRadius: '10px',                          /* Less round than before */
          padding: '18px 10px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.28), 0 1px 4px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {/* Logo / Wordmark */}
        <div
          className="flex items-center mb-7 flex-shrink-0 overflow-hidden"
          style={{ minHeight: '34px' }}
        >
          {/* Icon mark — white, no orange */}
          <div
            className="flex-shrink-0 flex items-center justify-center overflow-hidden premium-logo-container"
            style={{
              width:       '34px',
              height:      '34px',
              minWidth:    '34px',
              background:  '#FFFFFF',
              borderRadius:'7px',
            }}
          >
            {orgLogo ? (
              <img src={orgLogo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <ShieldCheck className="w-[18px] h-[18px] text-[#111111]" strokeWidth={2.5} />
            )}
          </div>

          {/* Brand name */}
          <div
            className="ml-3 overflow-hidden flex-shrink-0"
            style={{
              width:   expanded ? '140px' : '0px',
              opacity: expanded ? 1 : 0,
              transition: 'width 0.28s ease, opacity 0.22s ease',
            }}
          >
            <span
              className="font-black text-[16px] tracking-tight whitespace-nowrap"
              style={{
                color:       '#FFFFFF',
                fontFamily:  "'DM Sans', sans-serif",
                letterSpacing: '-0.03em',
              }}
            >
              {userName}
            </span>
          </div>
        </div>


        {/* ── Navigation ── */}
        <nav
          className="flex flex-col gap-0.5 flex-1 overflow-y-auto overflow-x-hidden"
          style={{ scrollbarWidth: 'none' }}
        >
          {navItems.map(({ href, label, icon: Icon }, idx) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

            return (
              <Link
                key={href}
                href={href}
                prefetch={true}
                title={!expanded ? label : undefined}
                className={`sidebar-link group ${isActive ? 'active' : ''}`}
                style={{
                  transitionDelay: `${idx * STAGGER}s`,
                  borderRadius:    '7px',
                  minHeight:       '40px',
                  justifyContent:  expanded ? 'flex-start' : 'center',
                }}
              >
                {/* Icon */}
                <Icon
                  className="sidebar-icon flex-shrink-0"
                  style={{
                    width:    '17px',
                    height:   '17px',
                    minWidth: '17px',
                    color: isActive ? '#111111' : 'rgba(255,255,255,0.50)',
                  }}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />

                {/* Label */}
                <span
                  className="overflow-hidden whitespace-nowrap text-[13px] font-semibold flex-shrink-0"
                  style={{
                    maxWidth:   expanded ? '160px' : '0px',
                    opacity:    expanded ? 1 : 0,
                    transition: 'max-width 0.26s ease, opacity 0.20s ease',
                    marginLeft: expanded ? '10px' : '0px',
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: '0.01em',
                    color: isActive ? '#111111' : 'rgba(255,255,255,0.72)',
                  }}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* ── Bottom: User + Theme + Logout ── */}
        <div
          className="flex flex-col gap-0.5 flex-shrink-0 mt-4 pt-4 overflow-hidden"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          {/* User avatar row */}
          <div
            className="flex items-center gap-3 px-2 py-2 overflow-hidden"
            style={{ minHeight: '42px' }}
          >
            {/* Avatar — white circle with dark initials */}
            <div
              className="flex-shrink-0 rounded-full flex items-center justify-center text-[13px] font-black premium-avatar"
              style={{
                width:      '30px',
                height:     '30px',
                minWidth:   '30px',
                background: '#FFFFFF',
                color:      '#111111',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {initials}
            </div>

            {/* Name */}
            <div
              className="overflow-hidden flex-shrink-0"
              style={{
                width:      expanded ? '120px' : '0px',
                opacity:    expanded ? 1 : 0,
                transition: 'width 0.26s ease, opacity 0.20s ease',
              }}
            >
              <p
                className="text-white text-[13px] font-bold whitespace-nowrap truncate"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {userName || userEmail.split('@')[0]}
              </p>
              <p
                className="text-[13px] whitespace-nowrap truncate"
                style={{ color: 'rgba(255,255,255,0.38)' }}
              >
                Gestor
              </p>
            </div>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="sidebar-link group"
            title={!expanded ? (theme === 'dark' ? 'Modo Claro' : 'Modo Escuro') : undefined}
            style={{
              borderRadius:   '7px',
              minHeight:      '38px',
              justifyContent: expanded ? 'flex-start' : 'center',
            }}
          >
            {theme === 'dark'
              ? <Sun  className="flex-shrink-0" style={{ width: '16px', height: '16px', minWidth: '16px', color: 'rgba(255,255,255,0.50)' }} strokeWidth={1.8} />
              : <Moon className="flex-shrink-0" style={{ width: '16px', height: '16px', minWidth: '16px', color: 'rgba(255,255,255,0.50)' }} strokeWidth={1.8} />
            }
            <span
              className="overflow-hidden whitespace-nowrap text-[13px] font-semibold flex-shrink-0"
              style={{
                maxWidth:   expanded ? '140px' : '0px',
                opacity:    expanded ? 1 : 0,
                transition: 'max-width 0.26s ease, opacity 0.20s ease',
                marginLeft: expanded ? '10px' : '0px',
                fontFamily: "'DM Sans', sans-serif",
                color:      'rgba(255,255,255,0.60)',
              }}
            >
              {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            </span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="sidebar-link group"
            title={!expanded ? 'Sair' : undefined}
            style={{
              borderRadius:   '7px',
              minHeight:      '38px',
              justifyContent: expanded ? 'flex-start' : 'center',
            }}
          >
            <LogOut
              className="flex-shrink-0"
              style={{ width: '16px', height: '16px', minWidth: '16px', color: 'rgba(255,255,255,0.38)' }}
              strokeWidth={1.8}
            />
            <span
              className="overflow-hidden whitespace-nowrap text-[13px] font-semibold flex-shrink-0"
              style={{
                maxWidth:   expanded ? '140px' : '0px',
                opacity:    expanded ? 1 : 0,
                transition: 'max-width 0.26s ease, opacity 0.20s ease',
                marginLeft: expanded ? '10px' : '0px',
                fontFamily: "'DM Sans', sans-serif",
                color:      'rgba(255,255,255,0.50)',
              }}
            >
              Sair da conta
            </span>
          </button>
        </div>
      </div>
    </aside>
  )
}
