import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  const statusLabels: Record<string, { label: string; class: string }> = {
    producao: { label: 'Em Produção', class: 'bg-blue-100 text-blue-700' },
    revisao: { label: 'Em Revisão', class: 'bg-yellow-100 text-yellow-700' },
    concluido: { label: 'Concluído', class: 'bg-green-100 text-green-700' },
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Projetos de Blindagem</h1>
          <p className="text-slate-500 text-sm mt-1">{projects?.length || 0} projetos no total</p>
        </div>
        <Link href="/projects/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Novo Projeto
        </Link>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p) => {
            const status = statusLabels[p.status] || { label: p.status, class: 'bg-slate-100 text-slate-600' }
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="soft-card p-5 block group hover:-translate-y-1 transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 group-hover:text-green-600 transition-colors">{p.customer_name}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">{p.vehicle_model || 'Veículo'} · {p.plate || 'Sem placa'}</p>
                  </div>
                  <span className={`stage-badge ${status.class}`}>{status.label}</span>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Progresso</span>
                    <span className="font-semibold">{p.overall_progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${p.overall_progress}%` }} />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">
                    {p.contract_value
                      ? `R$ ${Number(p.contract_value).toLocaleString('pt-BR')}`
                      : 'Valor a definir'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-green-500 transition-colors" />
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="soft-card p-12 text-center">
          <p className="text-slate-400 mb-4">Nenhum projeto ainda.</p>
          <Link href="/projects/new" className="btn-primary inline-flex">
            <Plus className="w-4 h-4" /> Criar Primeiro Projeto
          </Link>
        </div>
      )}
    </div>
  )
}
