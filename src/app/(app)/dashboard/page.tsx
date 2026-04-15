import { createClient } from '@/utils/supabase/server'
import { LayoutDashboard } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  let user = null;
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data?.user
  } catch (err) {
    console.error('Minimal Dashboard Error:', err)
  }

  return (
    <div className="flex-1 w-full flex flex-col px-6 py-6 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[26px] font-black tracking-tight" style={{ color: '#111111' }}>
            Acesso Confirmado
          </h1>
          <p className="text-[13px] font-medium mt-0.5" style={{ color: '#888888' }}>
            Bem-vindo ao sistema, {user?.email || 'Usuário'}.
          </p>
        </div>
      </div>
      
      <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
        <LayoutDashboard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Ambiente de Diagnóstico</h2>
        <p className="text-slate-500 max-w-sm mx-auto">
          Se você estiver vendo esta tela, as conexões básicas estão funcionando e o erro está em algum cálculo avançado do Dashboard original.
        </p>
      </div>
    </div>
  )
}
