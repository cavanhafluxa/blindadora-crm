import { createClient } from '@/utils/supabase/server'
import TeamClient from './TeamClient'

export const dynamic = 'force-dynamic'

export default async function TeamPage() {
  const supabase = await createClient()

  // In a real application, you'd fetch from profiles and join with auth.users if needed
  // For MVP, we just fetch from profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching team:', error)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 bg-[#F3F5F8]">
      <div className="mb-2 flex-shrink-0">
        <h1 className="text-2xl font-bold text-slate-800">Colaboradores</h1>
        <p className="text-slate-500 text-sm mt-1">Gerencie logins e permissões da equipe</p>
      </div>
      <TeamClient initialProfiles={profiles || []} />
    </div>
  )
}
