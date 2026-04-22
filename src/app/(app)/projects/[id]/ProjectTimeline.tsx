'use client'

import { useState, useEffect } from 'react'
import { ClipboardCheck, CheckCircle2, Clock, User } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function ProjectTimeline({ 
  initialEvents, 
  projectId,
  teamMembers
}: { 
  initialEvents: any[], 
  projectId: string,
  teamMembers: any[]
}) {
  const [events, setEvents] = useState(initialEvents || [])
  const [visibleCount, setVisibleCount] = useState(10)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // Update local state if initialEvents changes from the server (e.g. after a router.refresh)
    setEvents(initialEvents)
  }, [initialEvents])

  useEffect(() => {
    // Subscribe to realtime inserts for this specific project
    const channelName = `project-events-${projectId}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_events',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          const newEvent = payload.new
          // Resolve full_name from teamMembers to show the name immediately
          const user = teamMembers.find(m => m.id === newEvent.user_id)
          
          const eventWithProfile = {
            ...newEvent,
            profiles: {
              full_name: user ? user.full_name : 'Sistema Automático'
            }
          }

          setEvents(prev => [eventWithProfile, ...prev])
          // Soft refresh to update server-side state in the background
          router.refresh()
        }
      )
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') {
          console.warn('Realtime subscription status:', status)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, teamMembers, router, supabase])

  const showMore = () => {
    setVisibleCount(prev => prev + 10)
  }

  return (
    <div className="space-y-6">
      <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
        {events.slice(0, visibleCount).map((event: any) => {
          const isCompleted = event.description?.includes('Concluída') || event.description?.includes('100%');
          const isChecklist = event.event_type === 'checklist_completed';
          
          // Ícone condicional
          const Icon = isChecklist ? ClipboardCheck : isCompleted ? CheckCircle2 : Clock;
          const iconBg = isChecklist ? 'bg-blue-50 text-blue-500 border-blue-200' : 
                         isCompleted ? 'bg-emerald-50 text-emerald-500 border-emerald-200' : 
                         'bg-amber-50 text-amber-500 border-amber-200';
          
          return (
            <div key={event.id} className="relative">
              <div className="absolute -left-7 top-1 bottom-0 flex flex-col items-center">
                <div className={`w-2.5 h-2.5 rounded-full ring-4 z-10 ${
                  isChecklist ? 'bg-blue-500 ring-blue-50' :
                  isCompleted ? 'bg-emerald-500 ring-emerald-50' : 
                  'bg-amber-500 ring-amber-50'
                }`}></div>
              </div>
              <div className="flex flex-col gap-2 pb-2">
                
                <div className="flex gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-100 ${iconBg}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0 bg-white border border-slate-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col gap-1 mb-3">
                      <p className="text-[13px] font-semibold text-slate-800">
                        {event.description}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 border-t border-slate-50">
                      <div className="flex items-center gap-2 text-[13px] text-slate-500 font-medium">
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <User className="w-3 h-3" />
                        </div>
                        <span>{event.profiles?.full_name || 'Sistema Automático'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[13px] text-slate-500 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span suppressHydrationWarning>
                          {new Date(event.created_at).toLocaleDateString('pt-BR')} às {new Date(event.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {event.metadata?.photo_url && (
                      <div className="mt-4">
                        <a 
                          href={event.metadata.photo_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-block relative rounded-lg overflow-hidden border border-slate-200 group/img shadow-sm"
                        >
                          <img 
                            src={event.metadata.photo_url} 
                            alt="Evidência fotográfica" 
                            className="h-24 w-auto object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {events.length > visibleCount && (
        <div className="flex justify-center pt-2">
          <button
            onClick={showMore}
            className="flex items-center gap-2 px-6 py-2.5 text-[13px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
          >
            Ver mais eventos
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-[11px] text-slate-500">
              {events.length - visibleCount}
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
