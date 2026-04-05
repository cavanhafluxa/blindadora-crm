'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function SupabaseRealtimeSync() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Escuta mudanças na tabela projects
    const projectsChannel = supabase
      .channel('projects_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        router.refresh()
      })
      .subscribe()

    // Escuta mudanças na tabela production_stages
    const stagesChannel = supabase
      .channel('stages_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_stages' }, () => {
        router.refresh()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(projectsChannel)
      supabase.removeChannel(stagesChannel)
    }
  }, [supabase, router])

  return null // Componente invisível
}
