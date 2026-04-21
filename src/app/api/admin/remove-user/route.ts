import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', currentUser.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { targetUserId } = await req.json()
    if (!targetUserId) return NextResponse.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 })

    const adminClient = createAdminClient()

    // Verificar se o usuário alvo pertence à mesma organização
    const { data: targetProfile } = await adminClient
      .from('profiles')
      .select('organization_id')
      .eq('id', targetUserId)
      .single()

    if (targetProfile?.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'Usuário não pertence à sua organização.' }, { status: 403 })
    }

    // Deletar do Auth (automaticamente deleta perfil via CASCADE se configurado, senão fazemos manual)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetUserId)
    
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Remove User Error:', error)
    return NextResponse.json({ 
      error: 'Erro interno ao remover colaborador.',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
