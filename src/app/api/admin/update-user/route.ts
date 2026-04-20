import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !currentUser) {
      return NextResponse.json({ error: 'Sessão inválida ou expirada.' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', currentUser.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil do administrador não encontrado.' }, { status: 403 })
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem gerenciar a equipe.' }, { status: 403 })
    }

    const body = await req.json()
    const { targetUserId, full_name, role } = body
    if (!targetUserId) return NextResponse.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 })

    const adminClient = createAdminClient()

    // Verificar se o usuário alvo pertence à mesma organização
    const { data: targetProfile, error: targetError } = await adminClient
      .from('profiles')
      .select('organization_id')
      .eq('id', targetUserId)
      .single()

    if (targetError || !targetProfile) {
      return NextResponse.json({ error: 'Colaborador não encontrado.' }, { status: 404 })
    }

    if (targetProfile.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'Acesso negado: Colaborador não pertence à sua organização.' }, { status: 403 })
    }

    // Atualizar no banco de dados
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        full_name: full_name,
        role: role
      })
      .eq('id', targetUserId)
    
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Update User Error:', error)
    return NextResponse.json({ 
      error: 'Erro interno ao atualizar usuário.',
      details: error.message 
    }, { status: 500 })
  }
}
