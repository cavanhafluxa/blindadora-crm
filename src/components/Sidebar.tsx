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
  Users,
  LifeBuoy,
  FileText,
  ClipboardList,
  LogOut,
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
  { href: '/audit',       label: 'Histórico',       icon: ClipboardList },
  { href: '/settings',    label: 'Configurações',   icon: Settings },
]

const STAGGER = 0.04 // seconds

export default function Sidebar({ userEmail, userId }: { userEmail: string; userId: string }) {
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = createClient()

  const [userName, setUserName] = useState<string>('')
  const [orgName,  setOrgName]  = useState<string>('PROblind')
  const [orgLogo,  setOrgLogo]  = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
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
      className="fixed left-4 top-4 bottom-4 z-[150] flex flex-col"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        width: expanded ? '240px' : '72px',
        transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* ── Main Sidebar Container (Floating Pill) ── */}
      <div
        className="flex flex-col h-full overflow-hidden bg-black items-center"
        style={{
          borderRadius: '24px',
          padding: '24px 0',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Logo / Brand */}
        <div
          className="flex items-center mb-10 flex-shrink-0 w-full"
          style={{ minHeight: '40px' }}
        >
          <div className="w-[72px] flex-shrink-0 flex items-center justify-center">
            <div
              className="flex-shrink-0 flex items-center justify-center bg-white rounded-xl shadow-lg"
              style={{
                width: '40px',
                height: '40px',
              }}
            >
              {orgLogo ? (
                <img src={orgLogo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-black" strokeWidth={2.5} />
              )}
            </div>
          </div>

          <div
            className="overflow-hidden"
            style={{
              width: expanded ? '140px' : '0px',
              opacity: expanded ? 1 : 0,
              transition: 'width 0.3s ease, opacity 0.2s ease',
              marginLeft: expanded ? '4px' : '0px',
            }}
          >
            <span className="font-bold text-[15px] tracking-tight text-white whitespace-nowrap">
              {orgName}
            </span>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav
          className="flex flex-col gap-1.5 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar w-full px-2"
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
                className={`
                  flex items-center h-[44px] rounded-[20px] transition-all duration-200 group w-full
                  ${isActive ? 'bg-white text-black shadow-[0_4px_12px_rgba(255,255,255,0.15)]' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/60'}
                `}
              >
                <div className="flex-shrink-0 flex items-center justify-center" style={{ width: '52px', minWidth: '52px' }}>
                  <Icon
                    className={`flex-shrink-0 transition-transform duration-200 ${!isActive ? 'group-hover:scale-110' : ''}`}
                    style={{ width: '19px', height: '19px' }}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>

                <span
                  className="overflow-hidden whitespace-nowrap text-[13px] font-medium"
                  style={{
                    maxWidth: expanded ? '160px' : '0px',
                    opacity: expanded ? 1 : 0,
                    transition: 'max-width 0.35s ease, opacity 0.2s ease',
                    marginLeft: 0,
                  }}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* ── Bottom Section ── */}
        <div
          className="flex flex-col gap-1.5 flex-shrink-0 mt-6 pt-6 w-full px-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* User Profile */}
          <div
            className={`flex items-center h-[48px] rounded-[20px] transition-all duration-200 w-full ${expanded ? 'bg-zinc-900/40' : ''}`}
          >
            <div className="flex-shrink-0 flex items-center justify-center" style={{ width: '52px', minWidth: '52px' }}>
              <div
                className="flex-shrink-0 rounded-full bg-white text-black flex items-center justify-center text-[12px] font-bold shadow-sm"
                style={{ width: '32px', height: '32px' }}
              >
                {initials}
              </div>
            </div>

            <div
              className="overflow-hidden flex flex-col"
              style={{
                width: expanded ? '130px' : '0px',
                opacity: expanded ? 1 : 0,
                transition: 'width 0.35s ease, opacity 0.2s ease',
              }}
            >
              <span className="text-white text-[13px] font-semibold truncate">
                {userName || userEmail.split('@')[0]}
              </span>
              <span className="text-zinc-500 text-[11px] font-medium">Gestor</span>
            </div>
          </div>

          {/* Support */}
          <Link
            href="/support"
            className="flex items-center h-[44px] rounded-[20px] text-zinc-500 hover:text-white hover:bg-zinc-800/60 transition-all duration-200 w-full"
          >
            <div className="flex-shrink-0 flex items-center justify-center" style={{ width: '52px', minWidth: '52px' }}>
              <LifeBuoy className="w-5 h-5 flex-shrink-0" />
            </div>
            <span
              className="overflow-hidden whitespace-nowrap text-[14px] font-medium"
              style={{
                maxWidth: expanded ? '160px' : '0px',
                opacity: expanded ? 1 : 0,
                transition: 'max-width 0.35s ease, opacity 0.2s ease',
              }}
            >
              Suporte
            </span>
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center h-[44px] rounded-[20px] text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 w-full"
          >
            <div className="flex-shrink-0 flex items-center justify-center" style={{ width: '52px', minWidth: '52px' }}>
              <LogOut className="w-5 h-5 flex-shrink-0" />
            </div>
            <span
              className="overflow-hidden whitespace-nowrap text-[14px] font-medium"
              style={{
                maxWidth: expanded ? '160px' : '0px',
                opacity: expanded ? 1 : 0,
                transition: 'max-width 0.35s ease, opacity 0.2s ease',
              }}
            >
              Sair
            </span>
          </button>
        </div>

      </div>
    </aside>
  )
}
