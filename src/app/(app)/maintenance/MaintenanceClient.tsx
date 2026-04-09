'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Wrench, Plus, X, Star, CheckCircle, Clock, Calendar, Truck, AlertTriangle, MessageCircle } from 'lucide-react'

type MaintenanceOrder = {
  id: string
  project_id: string | null
  issue_description: string | null
  scheduled_date: string | null
  status: string
  cost: number | null
  created_at: string
  type?: string
  customer_phone?: string | null
  projects?: { customer_name: string; plate: string | null; vehicle_model: string | null } | null
}

type Project = { id: string; customer_name: string; plate: string | null; vehicle_model: string | null }

const STATUS_CONFIG = {
  scheduled: { label: 'Agendado', color: 'text-blue-700', bg: 'bg-blue-100', icon: Calendar },
  in_progress: { label: 'Em Execução', color: 'text-amber-700', bg: 'bg-amber-100', icon: Wrench },
  completed: { label: 'Concluído', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'text-slate-500', bg: 'bg-slate-100', icon: X },
}

const TYPE_CONFIG: Record<string, string> = {
  corrective: 'Corretiva',
  scheduled_6m: 'Revisão 6 Meses',
  scheduled_12m: 'Revisão 12 Meses',
  warranty: 'Garantia'
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
  
  // Filters
  const [filterProject, setFilterProject] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')

  const [form, setForm] = useState({ project_id: '', issue_description: '', scheduled_date: '', cost: '', type: 'corrective', customer_phone: '' })
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
    const { data } = await supabase.from('maintenance_orders').insert({
      project_id: form.project_id || null,
      issue_description: form.issue_description || null,
      scheduled_date: form.scheduled_date || null,
      cost: form.cost ? Number(form.cost) : null,
      type: form.type || 'corrective',
      customer_phone: form.customer_phone || null,
      organization_id: orgId,
    }).select('*, projects(customer_name, plate, vehicle_model)').single()

    if (data) setOrders(prev => [data as MaintenanceOrder, ...prev])
    setSaving(false)
    setShowForm(false)
    setForm({ project_id: '', issue_description: '', scheduled_date: '', cost: '', type: 'corrective', customer_phone: '' })
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('maintenance_orders').update({ status }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  async function markAsNotified(id: string) {
    const now = new Date().toISOString()
    await supabase.from('maintenance_orders').update({ notified_at: now }).eq('id', id)
    // Optional UI reflection if we wanted to show checkmark
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

  let filtered = orders
  if (filterProject) filtered = filtered.filter(o => o.project_id === filterProject)
  if (filterStatus) filtered = filtered.filter(o => o.status === filterStatus)
  if (filterType) filtered = filtered.filter(o => o.type === filterType)

  // Sort: scheduled ones first, then nearest scheduled_date
  filtered.sort((a,b) => {
    if (a.status === 'scheduled' && b.status !== 'scheduled') return -1
    if (b.status === 'scheduled' && a.status !== 'scheduled') return 1
    const tA = new Date(a.scheduled_date || a.created_at).getTime()
    const tB = new Date(b.scheduled_date || b.created_at).getTime()
    return tB - tA
  })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pós-Venda & Manutenção</h1>
          <p className="text-slate-500 text-sm mt-1">Ordens de serviço, revisões e garantias</p>
        </div>
        <button className="btn-primary flex-shrink-0" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Nova OS / Revisão
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5 p-4 bg-slate-50 border border-slate-100 rounded-xl">
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none flex-1 min-w-[200px]">
          <option value="">Todos os Projetos</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.customer_name} {p.plate ? `— ${p.plate}` : ''}</option>
          ))}
        </select>
        
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none">
          <option value="">Qualquer Status</option>
          <option value="scheduled">Agendado</option>
          <option value="in_progress">Em Execução</option>
          <option value="completed">Concluído</option>
        </select>

        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none">
          <option value="">Qualquer Tipo</option>
          <option value="corrective">Corretiva</option>
          <option value="scheduled_6m">Revisão 6 Meses</option>
          <option value="scheduled_12m">Revisão 12 Meses</option>
          <option value="warranty">Garantia</option>
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div className="soft-card p-5 mb-6 border-l-4 border-indigo-500">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-semibold text-slate-800">Novo Agendamento</h3>
             <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-red-500"><X className="w-5 h-5"/></button>
          </div>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Tipo de Ordem</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 flex-1">
                <option value="corrective">Corretiva</option>
                <option value="scheduled_6m">Revisão 6 Meses</option>
                <option value="scheduled_12m">Revisão 12 Meses</option>
                <option value="warranty">Garantia</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Veículo / Projeto</label>
              <select value={form.project_id} onChange={e => {
                const proj = projects.find(p => p.id === e.target.value)
                setForm(p => ({ ...p, project_id: e.target.value }))
              }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                <option value="">Selecione (opcional)</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.customer_name} — {p.vehicle_model || 'Veículo'}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Telefone (Wa.me)</label>
              <input type="text" value={form.customer_phone} onChange={e => setForm(p => ({ ...p, customer_phone: e.target.value }))}
                placeholder="Ex: 11999999999"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Data Agendada</label>
              <input type="date" value={form.scheduled_date} onChange={e => setForm(p => ({ ...p, scheduled_date: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-600 block mb-1">Descrição</label>
              <input required type="text" value={form.issue_description} onChange={e => setForm(p => ({ ...p, issue_description: e.target.value }))}
                placeholder="Ex: Vidro elétrico do motorista com falha ou O.S Base"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Custo (R$)</label>
              <input type="number" value={form.cost} onChange={e => setForm(p => ({ ...p, cost: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="0" />
            </div>
            <div className="flex gap-3 items-end md:col-span-2 lg:col-span-3">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Criando...' : 'Confirmar O.S'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Orders list */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="soft-card p-12 text-center text-slate-400 text-sm">Nenhuma ordem listada nesta pesquisa.</div>
        ) : filtered.map(order => {
          const cfg = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.scheduled
          const Icon = cfg.icon
          const typeName = TYPE_CONFIG[order.type || 'corrective'] || 'Corretiva'
          
          let urgencyBadge = null
          if (order.status === 'scheduled' && order.scheduled_date) {
             const daysDiff = Math.ceil((new Date(order.scheduled_date).getTime() - new Date().getTime()) / 86400000)
             if (daysDiff < 0) urgencyBadge = <span className="text-[10px] items-center gap-1 font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex"><AlertTriangle className="w-3 h-3"/> Atrasada</span>
             else if (daysDiff <= 7) urgencyBadge = <span className="text-[10px] items-center gap-1 font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 flex"><Clock className="w-3 h-3"/> Em {daysDiff} dia(s)</span>
          }

          const phoneDigits = order.customer_phone?.replace(/\\D/g, '') || ''
          const wppMsg = encodeURIComponent(`Olá${order.projects?.customer_name ? ` ${order.projects.customer_name}` : ''}, aqui é da Blindadora. ${order.type?.includes('scheduled') ? `Lembrando que sua ${typeName} está agendada para ${new Date(order.scheduled_date || '').toLocaleDateString('pt-BR')}` : `Entrando em contato sobre a ordem de serviço: ${order.issue_description}`}. Teria um momento para confirmarmos?`)
          const wppUrl = phoneDigits ? `https://wa.me/55${phoneDigits}?text=${wppMsg}` : null

          return (
            <div key={order.id} className="soft-card p-5 group hover:border-indigo-100 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                  <Icon className={`w-5 h-5 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{typeName}</span>
                        {urgencyBadge}
                      </div>
                      <p className="font-semibold text-slate-800">{order.issue_description || 'Sem descrição'}</p>
                      {order.projects && (
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          {order.projects.customer_name} {order.projects.vehicle_model ? `— ${order.projects.vehicle_model}` : ''} {order.projects.plate ? `(${order.projects.plate})` : ''}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  </div>

                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50 flex-wrap">
                    {order.scheduled_date && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {new Date(order.scheduled_date).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    {order.cost && (
                      <span className="text-xs text-slate-500 font-medium">R$ {Number(order.cost).toLocaleString('pt-BR')}</span>
                    )}
                    
                    <div className="flex-1"></div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {wppUrl && (
                        <a href={wppUrl} target="_blank" rel="noreferrer" onClick={() => markAsNotified(order.id)}
                           className="text-xs px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg transition-colors font-medium flex items-center gap-1.5">
                          <MessageCircle className="w-3.5 h-3.5" /> Avisar via WhatsApp
                        </a>
                      )}
                      {order.status !== 'in_progress' && order.status !== 'completed' && (
                        <button onClick={() => updateStatus(order.id, 'in_progress')}
                          className="text-xs px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors font-medium border-dashed">
                          Começar O.S
                        </button>
                      )}
                      {order.status !== 'completed' && (
                        <button onClick={() => updateStatus(order.id, 'completed')}
                          className="text-xs px-3 py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors font-medium shadow-sm">
                          Marcar Concluído
                        </button>
                      )}
                      {order.status === 'completed' && order.project_id && (
                        <button onClick={() => setRatingModal(order)}
                          className="text-xs px-3 py-1.5 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200 rounded-lg transition-colors font-medium flex items-center gap-1 shadow-sm">
                          <Star className="w-3 h-3" /> Avaliar Serviço
                        </button>
                      )}
                    </div>
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
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl mb-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none" />
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
