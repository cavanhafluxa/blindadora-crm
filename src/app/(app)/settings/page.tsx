import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SettingsContent from './SettingsContent'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()

  // 1. Pegar usuário atual
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Buscar perfil completo (incluindo campos novos)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organizations(*)')
    .eq('id', user.id)
    .single()

  if (!profile) return <div>Erro ao carregar perfil.</div>

  // 3. Buscar todos os usuários da organização (apenas se for ADMIN para a aba de Segurança)
  let team: any[] = []
  if (profile.role === 'admin') {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('full_name')
    team = data || []
  }

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] overflow-y-auto">
      <div className="p-8 max-w-6xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Configurações</h1>
          <p className="text-slate-500 font-medium">Gerencie o seu perfil, as informações da blindadora e sua equipe.</p>
        </div>
        
        <SettingsContent 
          initialProfile={profile} 
          initialOrg={profile.organizations}
          initialTeam={team}
          currentUserEmail={user.email}
        />
      </div>
    </div>
  )
}
