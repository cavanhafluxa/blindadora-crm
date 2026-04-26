'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  Bell,
  ShieldAlert,
  Clock,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  CreditCard,
  TrendingDown,
  CalendarClock,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Notification = {
  id: string
  type: string
  title: string
  body: string
  link: string | null
  read: boolean
  created_at: string
}

// Priority: red > orange > blue
const typeConfig: Record<string, { icon: React.ReactNode; color: string; dot: string }> = {
  payment_overdue_income:   { icon: <TrendingDown className="w-4 h-4" />, color: 'text-rose-600 bg-rose-50 border-rose-200',   dot: 'bg-rose-500' },
  payment_overdue_expense:  { icon: <CreditCard className="w-4 h-4" />,   color: 'text-rose-600 bg-rose-50 border-rose-200',   dot: 'bg-rose-500' },
  payment_due_soon_income:  { icon: <CalendarClock className="w-4 h-4" />, color: 'text-orange-600 bg-orange-50 border-orange-200', dot: 'bg-orange-500' },
  payment_due_soon_expense: { icon: <CalendarClock className="w-4 h-4" />, color: 'text-orange-600 bg-orange-50 border-orange-200', dot: 'bg-orange-500' },
  payment_due_week_income:  { icon: <CalendarClock className="w-4 h-4" />, color: 'text-amber-600 bg-amber-50 border-amber-200', dot: 'bg-amber-400' },
  payment_due_week_expense: { icon: <CalendarClock className="w-4 h-4" />, color: 'text-amber-600 bg-amber-50 border-amber-200', dot: 'bg-amber-400' },
  revision_due:             { icon: <Clock className="w-4 h-4" />,         color: 'text-orange-600 bg-orange-50 border-orange-200', dot: 'bg-orange-500' },
  pending_sicovab:          { icon: <ShieldAlert className="w-4 h-4" />,   color: 'text-red-600 bg-red-50 border-red-200',      dot: 'bg-red-500' },
  overdue_project:          { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-600 bg-red-50 border-red-200',      dot: 'bg-red-600' },
}

const defaultConfig = { icon: <Bell className="w-4 h-4" />, color: 'text-slate-500 bg-slate-50 border-slate-200', dot: 'bg-slate-400' }

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 2) return 'agora'
  if (mins < 60) return `${mins}min atrás`
  if (hours < 24) return `${hours}h atrás`
  return `${days}d atrás`
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // Load notifications (call generate API silently then fetch)
  async function loadNotifs() {
    setLoading(true)
    try {
      // Call the generator with internal header so no CRON_SECRET is needed
      await fetch('/api/generate-notifications', {
        headers: { 'x-internal-call': '1' },
      }).catch(() => {})

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('read', false)
        .order('created_at', { ascending: false })

      if (data) setNotifications(data as Notification[])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifs()

    // Realtime subscription
    const channel = supabase
      .channel('notifs-bell')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        loadNotifs()
      })
      .subscribe()

    // Refresh every 5 minutes
    const interval = setInterval(loadNotifs, 5 * 60 * 1000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function markAsRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  async function markAllAsRead() {
    const ids = notifications.map(n => n.id)
    if (ids.length === 0) return
    await supabase.from('notifications').update({ read: true }).in('id', ids)
    setNotifications([])
    setOpen(false)
  }

  // Group by severity bucket
  const overdueCount  = notifications.filter(n => n.type.includes('overdue') || n.type === 'pending_sicovab').length
  const urgentCount   = notifications.filter(n => n.type.includes('due_soon')).length
  const approachCount = notifications.filter(n => n.type.includes('due_week') || n.type === 'revision_due').length
  const totalUnread   = notifications.length

  // Badge color: red if any overdue, orange if any urgent, amber otherwise
  const badgeColor = overdueCount > 0 ? 'bg-rose-500' : urgentCount > 0 ? 'bg-orange-500' : 'bg-amber-400'

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200"
        title="Notificações"
      >
        <Bell className={`w-[18px] h-[18px] transition-colors ${totalUnread > 0 ? 'text-slate-700' : 'text-slate-400'}`} />
        {totalUnread > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] ${badgeColor} text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white pointer-events-none`}>
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-3 w-[380px] bg-white border border-slate-200/80 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-semibold text-slate-800">Notificações</h3>
              {totalUnread > 0 && (
                <p className="text-[12px] text-slate-400 mt-0.5">
                  {overdueCount > 0 && <span className="text-rose-500 font-medium">{overdueCount} vencido{overdueCount > 1 ? 's' : ''} · </span>}
                  {urgentCount > 0  && <span className="text-orange-500 font-medium">{urgentCount} urgente{urgentCount > 1 ? 's' : ''} · </span>}
                  {approachCount > 0 && <span className="text-amber-500 font-medium">{approachCount} próximo{approachCount > 1 ? 's' : ''}</span>}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {totalUnread > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[12px] font-medium text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Limpar todas
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-50">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mx-auto" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center gap-2">
                <CheckCircle className="w-10 h-10 text-emerald-200" />
                <p className="text-[13px] font-medium text-slate-400">Tudo em dia!</p>
                <p className="text-[12px] text-slate-300">Nenhuma pendência financeira ou operacional.</p>
              </div>
            ) : (
              notifications.map(n => {
                const cfg = typeConfig[n.type] || defaultConfig
                return (
                  <div key={n.id} className="flex items-start gap-3.5 px-5 py-4 hover:bg-slate-50/80 transition-colors group">
                    {/* Icon */}
                    <div className={`mt-0.5 w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                      {cfg.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800 leading-snug">{n.title}</p>
                      <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[11px] text-slate-300">{timeAgo(n.created_at)}</span>
                        {n.link && (
                          <Link
                            href={n.link}
                            onClick={() => { setOpen(false); markAsRead(n.id) }}
                            className="text-[12px] font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 transition-colors"
                          >
                            Ver <ExternalLink className="w-3 h-3 ml-0.5" />
                          </Link>
                        )}
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="text-[12px] text-slate-300 hover:text-slate-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          Ignorar
                        </button>
                      </div>
                    </div>

                    {/* Dot */}
                    <div className={`mt-2 w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {totalUnread > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
              <Link
                href="/financial"
                onClick={() => setOpen(false)}
                className="text-[12px] font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
              >
                Ver todo o financeiro <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
