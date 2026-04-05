'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Wrench, Plus, X, Star, CheckCircle, Clock, Calendar, Truck } from 'lucide-react'

type MaintenanceOrder = {
  id: string
  project_id: string | null
  issue_description: string | null
  scheduled_date: string | null
  status: string
  cost: number | null
  created_at: string
  projects?: { customer_name: string; plate: string | null; vehicle_model: string | null } | null
}

type Project = { id: string; customer_name: string; plate: string | null; vehicle_model: string | null }

const STATUS_CONFIG = {
  scheduled: { label: 'Agendado', color: 'text-blue-700', bg: 'bg-blue-100', icon: Calendar },
  in_progress: { label: 'Em Execução', color: 'text-amber-700', bg: 'bg-amber-100', icon: Wrench },
  completed: { label: 'Concluído', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'text-slate-500', bg: 'bg-slate-100', icon: X },
}

export default function MaintenanceClient({
  initialOrders,
  projects,
}: {
  initialOrders: MaintenanceOrder[]
  projects: Project[]
}) {
  const supabase = createClient()
  const [orders, setOrders] = useState<MaintenanceOrder[]>(initialOrders)
  const [showForm, setShowForm] = useState(false)
  const [ratingModal, setRatingModal] = useState<MaintenanceOrder | null>(null)
  const [rating, setRating] = useState(0)
  const [ratingNote, setRatingNote] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [form, setForm] = useState({ project_id: '', issue_description: '', scheduled_date: '', cost: '' })
  const [saving, setSaving] = useState(false)

  async function getOrgId() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    return data?.organization_id ?? null
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const orgId = await getOrgId()
    const project = projects.find(p => p.id === form.project_id)
    const { data } = await supabase.from('maintenance_orders').insert({
      project_id: form.project_id || null,
      issue_description: form.issue_description || null,
      scheduled_date: form.scheduled_date || null,
      cost: form.cost ? Number(form.cost) : null,
      organization_id: orgId,
    }).select('*, projects(customer_name, plate, vehicle_model)').single()

    if (data) setOrders(prev => [data as MaintenanceOrder, ...prev])
    setSaving(false)
    setShowForm(false)
    setForm({ project_id: '', issue_description: '', scheduled_date: '', cost: '' })
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('maintenance_orders').update({ status }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  async function saveRating() {
    if (!ratingModal) return
    await supabase.from('projects').update({
      satisfaction_rating: rating,
      satisfaction_notes: ratingNote,
    }).eq('id', ratingModal.project_id)
    setRatingModal(null)
    setRating(0)
    setRatingNote('')
  }

  const filtered = filterProject ? orders.filter(o => o.project_id === filterProject) : orders

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pós-Venda & Manutenção</h1>
          <p className="text-slate-500 text-sm mt-1">Ordens de serviço e acompanhamento de clientes</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Nova OS
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:outline-none">
          <option value="">Todos os veículos</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.customer_name} {p.plate ? `— ${p.plate}` : ''}</option>
          ))}
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div className="soft-card p-5 mb-6">
          <h3 className="font-semibold text-slate-800 mb-4">Nova Ordem de Serviço</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Veículo / Projeto</label>
              <select value={form.project_id} onChange={e => setForm(p => ({ ...p, project_id: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:outline-none">
                <option value="">Selecione (opcional)</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.customer_name} — {p.vehicle_model || 'Veículo'}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Data Agendada</label>
              <input type="date" value={form.scheduled_date} onChange={e => setForm(p => ({ ...p, scheduled_date: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Descrição do Problema *</label>
              <input required type="text" value={form.issue_description} onChange={e => setForm(p => ({ ...p, issue_description: e.target.value }))}
                placeholder="Ex: Vidro elétrico do motorista com falha"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Custo Estimado (R$)</label>
              <input type="number" value={form.cost} onChange={e => setForm(p => ({ ...p, cost: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="0" />
            </div>
            <div className="flex gap-3 items-center">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Criar OS'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-500">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Orders list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="soft-card p-12 text-center text-slate-400 text-sm">Nenhuma ordem de serviço encontrada.</div>
        ) : filtered.map(order => {
          const cfg = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.scheduled
          const Icon = cfg.icon
          return (
            <div key={order.id} className="soft-card p-5">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                  <Icon className={`w-5 h-5 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-semibold text-slate-800">{order.issue_description || 'Sem descrição'}</p>
                      {order.projects && (
                        <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5" />
                          {order.projects.customer_name} {order.projects.vehicle_model ? `— ${order.projects.vehicle_model}` : ''} {order.projects.plate ? `(${order.projects.plate})` : ''}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  </div>

                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                    {order.scheduled_date && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {new Date(order.scheduled_date).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    {order.cost && (
                      <span className="text-xs text-slate-500">R$ {Number(order.cost).toLocaleString('pt-BR')}</span>
                    )}
                  </div>

                  {/* Status buttons */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {order.status !== 'in_progress' && order.status !== 'completed' && (
                      <button onClick={() => updateStatus(order.id, 'in_progress')}
                        className="text-xs px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors font-medium">
                        ▶ Iniciar
                      </button>
                    )}
                    {order.status !== 'completed' && (
                      <button onClick={() => updateStatus(order.id, 'completed')}
                        className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium">
                        ✓ Concluir
                      </button>
                    )}
                    {order.status === 'completed' && order.project_id && (
                      <button onClick={() => setRatingModal(order)}
                        className="text-xs px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors font-medium flex items-center gap-1">
                        <Star className="w-3 h-3" /> Avaliação
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Rating Modal */}
      {ratingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-slate-800 mb-1">Avaliação de Satisfação</h3>
            <p className="text-sm text-slate-500 mb-4">Como o cliente avaliou o serviço?</p>
            <div className="flex gap-2 justify-center mb-4">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)}
                  className={`text-3xl transition-transform hover:scale-110 ${s <= rating ? 'opacity-100' : 'opacity-30'}`}>
                  ⭐
                </button>
              ))}
            </div>
            <textarea rows={3} value={ratingNote} onChange={e => setRatingNote(e.target.value)}
              placeholder="Comentário do cliente (opcional)..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl mb-4 focus:ring-2 focus:ring-green-500 focus:outline-none resize-none" />
            <div className="flex gap-3">
              <button onClick={() => setRatingModal(null)} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600">Cancelar</button>
              <button onClick={saveRating} disabled={rating === 0} className="flex-1 btn-primary justify-center disabled:opacity-50">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
