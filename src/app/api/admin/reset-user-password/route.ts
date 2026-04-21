import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
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

    const { targetUserId, newPassword } = await req.json()
    if (!targetUserId || !newPassword) return NextResponse.json({ error: 'ID e nova senha são obrigatórios.' }, { status: 400 })

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

    // Atualizar senha no Auth
    const { error: updateError } = await adminClient.auth.admin.updateUserById(targetUserId, {
      password: newPassword
    })
    
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Reset Password Error:', error)
    return NextResponse.json({ 
      error: 'Erro interno ao redefinir senha.',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
