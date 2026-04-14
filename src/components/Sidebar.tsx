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
  { href: '/dashboard',  label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/pipeline',   label: 'Pipeline',        icon: Kanban          },
  { href: '/proposals',  label: 'Propostas',       icon: FileText        },
  { href: '/projects',   label: 'Projetos',        icon: Car             },
  { href: '/materials',  label: 'Estoque',         icon: Package         },
  { href: '/financial',  label: 'Financeiro',      icon: Wallet          },
  { href: '/maintenance',label: 'Pós-Venda',       icon: Wrench          },
  { href: '/team',       label: 'Colaboradores',   icon: Users           },
  { href: '/audit',      label: 'Histórico',       icon: FileText        },
  { href: '/settings',   label: 'Configurações',   icon: Settings        },
]

// ──────────────────────────────────────────────
//  Stagger delay per icon
// ──────────────────────────────────────────────
const STAGGER = 0.05 // seconds

export default function Sidebar({ userEmail, userId }: { userEmail: string; userId: string }) {
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = createClient()

  const [theme,    setTheme]    = useState('light')
  const [userName, setUserName] = useState<string>('')
  const [expanded, setExpanded] = useState(false)

  // ── Bootstrap theme + profile ──
  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'light'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)

    async function loadProfile() {
      const cacheKey = `user_name_${userId}`
      const cached   = localStorage.getItem(cacheKey)
      if (cached) setUserName(cached)

      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single()

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

  const initials = userName ? userName.charAt(0).toUpperCase() : userEmail.charAt(0).toUpperCase()

  return (
    /**
     * FLOATING PILL WRAPPER
     * position:fixed, 20px from every edge, black pill background
     */
    <aside
      className="fixed left-5 top-5 bottom-5 z-50 flex flex-col"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        width: expanded ? '220px' : '68px',
        transition: 'width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {/* ── The black pill ── */}
      <div
        className="pill-container flex flex-col h-full overflow-hidden"
        style={{ padding: '20px 12px' }}
      >
        {/* Logo / Wordmark */}
        <div
          className="flex items-center mb-8 flex-shrink-0 overflow-hidden"
          style={{ minHeight: '36px' }}
        >
          {/* Icon mark */}
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-xl bg-[#FA5D29]"
            style={{
              width: '36px',
              height: '36px',
              minWidth: '36px',
              boxShadow: '0 4px 12px rgba(250,93,41,0.40)',
            }}
          >
            <ShieldCheck className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>

          {/* Brand name — slides in on expand */}
          <div
            className="ml-3 overflow-hidden flex-shrink-0"
            style={{
              width: expanded ? '140px' : '0px',
              opacity: expanded ? 1 : 0,
              transition: 'width 0.3s ease, opacity 0.25s ease',
            }}
          >
            <span
              className="text-white font-black text-[17px] tracking-tight whitespace-nowrap"
              style={{ fontFamily: "'Inter Tight', sans-serif", letterSpacing: '-0.03em' }}
            >
              PRO<span style={{ color: '#FA5D29' }}>blind</span>
            </span>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none' }}>
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
                  borderRadius: '12px',
                  minHeight: '42px',
                  justifyContent: expanded ? 'flex-start' : 'center',
                }}
              >
                {/* Icon */}
                <Icon
                  className="sidebar-icon flex-shrink-0"
                  style={{
                    width: '18px',
                    height: '18px',
                    minWidth: '18px',
                    color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
                  }}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />

                {/* Label — slides in */}
                <span
                  className="overflow-hidden whitespace-nowrap text-[13px] font-semibold flex-shrink-0"
                  style={{
                    maxWidth: expanded ? '160px' : '0px',
                    opacity: expanded ? 1 : 0,
                    transition: 'max-width 0.28s ease, opacity 0.22s ease',
                    fontFamily: "'Inter Tight', sans-serif",
                    letterSpacing: '0.01em',
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
          className="flex flex-col gap-1 flex-shrink-0 mt-4 pt-4 overflow-hidden"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* User avatar row */}
          <div
            className="flex items-center gap-3 px-2 py-2 overflow-hidden"
            style={{ minHeight: '44px' }}
          >
            {/* Avatar */}
            <div
              className="flex-shrink-0 rounded-full flex items-center justify-center text-xs font-black text-white"
              style={{
                width: '32px',
                height: '32px',
                minWidth: '32px',
                background: 'linear-gradient(135deg, #FA5D29 0%, #E84410 100%)',
                boxShadow: '0 2px 8px rgba(250,93,41,0.40)',
                fontFamily: "'Inter Tight', sans-serif",
              }}
            >
              {initials}
            </div>

            {/* Name */}
            <div
              className="overflow-hidden flex-shrink-0"
              style={{
                width: expanded ? '120px' : '0px',
                opacity: expanded ? 1 : 0,
                transition: 'width 0.28s ease, opacity 0.22s ease',
              }}
            >
              <p
                className="text-white text-[13px] font-bold whitespace-nowrap truncate"
                style={{ fontFamily: "'Inter Tight', sans-serif" }}
              >
                {userName.split(' ')[0] || userEmail.split('@')[0]}
              </p>
              <p
                className="text-[11px] whitespace-nowrap truncate"
                style={{ color: 'rgba(255,255,255,0.40)' }}
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
              borderRadius: '12px',
              minHeight: '40px',
              justifyContent: expanded ? 'flex-start' : 'center',
            }}
          >
            {theme === 'dark'
              ? <Sun  className="flex-shrink-0" style={{ width: '17px', height: '17px', minWidth: '17px', color: 'rgba(255,255,255,0.55)' }} strokeWidth={1.8} />
              : <Moon className="flex-shrink-0" style={{ width: '17px', height: '17px', minWidth: '17px', color: 'rgba(255,255,255,0.55)' }} strokeWidth={1.8} />
            }
            <span
              className="overflow-hidden whitespace-nowrap text-[12px] font-semibold flex-shrink-0"
              style={{
                maxWidth: expanded ? '140px' : '0px',
                opacity: expanded ? 1 : 0,
                transition: 'max-width 0.28s ease, opacity 0.22s ease',
                marginLeft: expanded ? '12px' : '0px',
                fontFamily: "'Inter Tight', sans-serif",
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
              borderRadius: '12px',
              minHeight: '40px',
              justifyContent: expanded ? 'flex-start' : 'center',
            }}
          >
            <LogOut
              className="flex-shrink-0"
              style={{ width: '17px', height: '17px', minWidth: '17px', color: 'rgba(239,68,68,0.70)' }}
              strokeWidth={1.8}
            />
            <span
              className="overflow-hidden whitespace-nowrap text-[12px] font-semibold flex-shrink-0 text-red-400"
              style={{
                maxWidth: expanded ? '140px' : '0px',
                opacity: expanded ? 1 : 0,
                transition: 'max-width 0.28s ease, opacity 0.22s ease',
                marginLeft: expanded ? '12px' : '0px',
                fontFamily: "'Inter Tight', sans-serif",
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
