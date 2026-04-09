'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Bell, ShieldAlert, Clock, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Sync external clicks to close
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    let mounted = true

    async function loadNotifs() {
      // Geração proativa na API route (Simulando Edge Function agendada)
      await fetch('/api/generate-notifications').catch(() => {})
      
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('read', false)
        .order('created_at', { ascending: false })
      
      if (mounted && data) setNotifications(data)
    }

    loadNotifs()

    // Realtime se quisermos no futuro
    const channel = supabase.channel('notifs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        loadNotifs()
      }).subscribe()

    return () => {
       mounted = false
       supabase.removeChannel(channel)
    }
  }, [supabase])

  async function markAsRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
    router.refresh()
  }

  async function markAllAsRead() {
    for (const n of notifications) {
      await supabase.from('notifications').update({ read: true }).eq('id', n.id)
    }
    setNotifications([])
    setOpen(false)
  }

  const iconMap: Record<string, React.ReactNode> = {
    'revision_due': <Clock className="w-4 h-4 text-orange-500" />,
    'pending_sicovab': <ShieldAlert className="w-4 h-4 text-red-500" />,
    'overdue_project': <AlertTriangle className="w-4 h-4 text-red-600" />,
    'stale_lead': <Clock className="w-4 h-4 text-amber-500" />
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors relative"
      >
        <Bell className="w-5 h-5 text-slate-500" />
        {notifications.length > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white pointer-events-none"></span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 shadow-xl rounded-2xl z-50 overflow-hidden transform origin-top-right transition-all">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Notificações</h3>
            {notifications.length > 0 && (
              <button onClick={markAllAsRead} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                Marcar todas lidas
              </button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400 font-medium flex flex-col items-center">
                 <CheckCircle className="w-8 h-8 text-slate-200 mb-2" />
                 Tudo certo por aqui!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map(n => (
                  <div key={n.id} className="p-4 hover:bg-slate-50 transition-colors group">
                    <div className="flex gap-3 items-start">
                      <div className="mt-0.5 p-1.5 bg-white rounded-lg border border-slate-200 shadow-sm flex-shrink-0">
                        {iconMap[n.type] || <Bell className="w-4 h-4 text-slate-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-800">{n.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>
                        <div className="flex items-center gap-3 mt-2">
                          {n.link && (
                            <Link href={n.link} onClick={() => { setOpen(false); markAsRead(n.id); }} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                              Acessar <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                          <button onClick={() => markAsRead(n.id)} className="text-xs font-medium text-slate-400 hover:text-slate-600">
                            Ignorar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
