import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !currentUser) {
      return NextResponse.json({ error: 'Sessão inválida ou expirada.' }, { status: 401 })
    }

    // Verificar se quem está criando é admin
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', currentUser.id)
      .single()

    if (profileError || !adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem convidar novos membros.' }, { status: 403 })
    }

    const body = await req.json()
    const { full_name, email, password, role } = body

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // 1. Criar o usuário no Auth
    const { data: authData, error: createAuthError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    })

    if (createAuthError) {
      return NextResponse.json({ 
        error: 'Erro ao criar credenciais de acesso.', 
        details: createAuthError.message 
      }, { status: 400 })
    }

    const newUser = authData.user

    // 2. Criar o perfil vinculado à organização do administrador
    const { error: profileCreateError } = await adminClient
      .from('profiles')
      .update({
        full_name: full_name,
        role: role || 'employee',
        organization_id: adminProfile.organization_id
      })
      .eq('id', newUser.id)
    
    // Obs: Normalmente o trigger de 'handle_new_user' já criou o perfil, por isso usamos .update() ou .upsert()
    // Se o trigger não existir, usamos .insert()
    
    if (profileCreateError) {
      // Rollback: deletar o usuário criado no auth se o perfil falhar
      await adminClient.auth.admin.deleteUser(newUser.id)
      return NextResponse.json({ 
        error: 'Erro ao criar perfil do colaborador.', 
        details: profileCreateError.message 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      user: { id: newUser.id } 
    })

  } catch (error: any) {
    console.error('Create User Error:', error)
    return NextResponse.json({ 
      error: 'Erro interno ao criar usuário.',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
