import { createClient } from '@/utils/supabase/server'
import { LayoutDashboard } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  let user = null;
  let stats = {
    projects: 0,
    leads: 0,
    financials: 0,
    stages: 0,
    purchases: 0,
    stock: 0
  };
  let errorLog: string[] = [];

  try {
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    user = userData?.user

    const results = await Promise.allSettled([
      supabase.from('projects').select('id', { count: 'exact', head: true }),
      supabase.from('leads').select('id', { count: 'exact', head: true }),
      supabase.from('financials').select('id', { count: 'exact', head: true }),
      supabase.from('production_stages').select('id', { count: 'exact', head: true }),
      supabase.from('project_purchases').select('id', { count: 'exact', head: true }),
      supabase.from('stock_movements').select('id', { count: 'exact', head: true }),
    ])

    results.forEach((res, i) => {
      const names = ['Projetos', 'Leads', 'Financeiro', 'Etapas', 'Compras', 'Estoque']
      if (res.status === 'fulfilled') {
        // @ts-ignore
        if (res.value.error) errorLog.push(`${names[i]}: ${res.value.error.message}`)
        // @ts-ignore
        else stats[Object.keys(stats)[i]] = res.value.count || 0
      } else {
        errorLog.push(`${names[i]}: Rejeição na query`)
      }
    })

  } catch (err: any) {
    errorLog.push(`Erro Geral: ${err.message}`)
  }

  return (
    <div className="flex-1 w-full flex flex-col px-6 py-6 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[26px] font-black tracking-tight" style={{ color: '#111111' }}>
            Diagnóstico de Conexão
          </h1>
          <p className="text-[13px] font-medium mt-0.5" style={{ color: '#888888' }}>
            Verificando tabelas no Supabase...
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(stats).map(([key, val]) => (
          <div key={key} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">{key}</p>
            <p className="text-xl font-black text-slate-800">{val}</p>
          </div>
        ))}
      </div>

      {errorLog.length > 0 && (
        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
          <h3 className="text-sm font-bold text-red-700 mb-2">Erros Detectados:</h3>
          <ul className="list-disc list-inside text-xs text-red-600 space-y-1">
            {errorLog.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}

      {!errorLog.length && (
        <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-center">
          <h2 className="text-xl font-bold text-green-800 mb-2">Conexões Estáveis!</h2>
          <p className="text-green-600 max-w-sm mx-auto text-sm">
            Todas as tabelas foram acessadas com sucesso. O problema anterior era provavelmente um cálculo matemático com dados nulos ou um join inválido.
          </p>
        </div>
      )}
    </div>
  )
}

