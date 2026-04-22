'use client'

import { useState, useMemo } from 'react'
import {
  DndContext, DragOverlay, closestCorners,
  KeyboardSensor, PointerSensor, useSensor,
  useSensors, type DragStartEvent, type DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/utils/supabase/client'
import { Car, Phone, DollarSign, Plus, X, Shield, Wrench, BarChart2, Filter } from 'lucide-react'

type Lead = {
  id: string
  customer_name: string
  customer_phone: string | null
  vehicle_model: string | null
  armor_type: string | null
  quoted_value: number | null
  pipeline_stage: string
  source?: string | null
  qualification_score?: number | null
  assigned_to?: string | null
  plate?: string | null
  customer_cpf?: string | null
  customer_email?: string | null
  notes?: string | null
  type?: 'blindagem' | 'manutencao'
  created_at?: string
}

const STAGES = [
  { id: 'new', label: 'Inbound', dot: 'bg-blue-500', bg: 'bg-slate-50', border: 'border-slate-200/60' },
  { id: 'prospecting', label: 'Prospecção', dot: 'bg-amber-400', bg: 'bg-slate-50', border: 'border-slate-200/60' },
  { id: 'quoted', label: 'Orçado', dot: 'bg-purple-500', bg: 'bg-slate-50', border: 'border-slate-200/60' },
  { id: 'contracted', label: 'Fechado', dot: 'bg-emerald-500', bg: 'bg-slate-50', border: 'border-slate-200/60' },
  { id: 'lost', label: 'Perdido', dot: 'bg-red-600', bg: 'bg-slate-50', border: 'border-slate-200/60' },
]

function LeadCard({ lead, isOverlay, onClick, teamMembers }: { lead: Lead; isOverlay?: boolean; onClick?: () => void; teamMembers: any[] }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { type: 'lead', lead },
  })

  const style = { transition, transform: CSS.Transform.toString(transform) }
  const assignee = teamMembers.find(t => t.id === lead.assigned_to)

  if (isDragging) {
    return <div ref={setNodeRef} style={style} className="h-28 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/30" />
  }

  const isBlindagem = lead.type === 'blindagem' || !lead.type
  const borderColor = isBlindagem ? 'border-l-indigo-600' : 'border-l-amber-500'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-200/60 border-l-4 ${borderColor} cursor-grab active:cursor-grabbing hover:shadow-md hover:border-r-slate-300 transition-all group relative overflow-hidden ${isOverlay ? 'rotate-2 shadow-2xl scale-105' : ''}`}
    >
      <div className="absolute top-3 right-3 opacity-20 group-hover:opacity-40 transition-opacity">
        {isBlindagem ? <Shield className="w-8 h-8 text-indigo-600" /> : <Wrench className="w-8 h-8 text-amber-500" />}
      </div>

      <div className="flex justify-between items-start mb-3 relative z-10">
        <p className="font-semibold text-slate-800 text-sm truncate flex-1 group-hover:text-indigo-600 transition-colors">{lead.customer_name}</p>
        {lead.qualification_score !== undefined && lead.qualification_score !== null && (
          <span title={`Score: ${lead.qualification_score}`} className="text-[13px] font-bold px-2 py-1 rounded-full flex-shrink-0 ml-2 shadow-sm border" style={{
            backgroundColor: lead.qualification_score > 70 ? '#fef2f2' : lead.qualification_score > 30 ? '#fefce8' : '#f8fafc',
            borderColor: lead.qualification_score > 70 ? '#fca5a5' : lead.qualification_score > 30 ? '#fde047' : '#e2e8f0',
            color: lead.qualification_score > 70 ? '#ef4444' : lead.qualification_score > 30 ? '#eab308' : '#64748b'
          }}>
            {lead.qualification_score > 70 ? 'Quente' : lead.qualification_score > 30 ? 'Morno' : 'Frio'}
          </span>
        )}
      </div>
      
      <div className="space-y-1.5 mb-3 relative z-10">
        {lead.vehicle_model && (
          <div className="flex items-center gap-2 text-[13px] text-slate-500">
            <Car className="w-3.5 h-3.5 opacity-70" />
            <span className="truncate">{lead.vehicle_model} {lead.armor_type ? `(${lead.armor_type})` : ''}</span>
          </div>
        )}
        {lead.customer_phone && (
          <div className="flex items-center gap-2 text-[13px] text-slate-500">
            <Phone className="w-3.5 h-3.5 opacity-70" />
            <span>{lead.customer_phone}</span>
          </div>
        )}
        {lead.created_at && (
          <div className="text-[13px] text-slate-400 mt-2 border-t pt-1 border-slate-100">
            Criado em {new Date(lead.created_at).toLocaleDateString('pt-BR')}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 relative z-10">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-white text-[13px] font-bold text-slate-800 flex items-center justify-center premium-avatar">
            {assignee ? assignee.full_name.charAt(0).toUpperCase() : '?'}
          </div>
          <span className="text-[13px] font-medium text-slate-500 truncate max-w-[80px]">
            {assignee ? assignee.full_name.split(' ')[0] : 'Indefinido'}
          </span>
        </div>
        
        {lead.quoted_value ? (
          <div className="text-[13px] font-bold text-emerald-600">
            R$ {Number(lead.quoted_value).toLocaleString('pt-BR')}
          </div>
        ) : (
          <div className="text-[13px] text-slate-400 font-medium">Sem valor</div>
        )}
      </div>
    </div>
  )
}

function KanbanColumn({ stage, leads, onLeadClick, teamMembers }: { stage: typeof STAGES[0]; leads: Lead[], onLeadClick: (l: Lead) => void, teamMembers: any[] }) {
  const { setNodeRef } = useSortable({ id: stage.id, data: { type: 'column' } })

  return (
    <div ref={setNodeRef} className={`flex-shrink-0 w-[300px] h-full flex flex-col rounded-3xl border ${stage.border} ${stage.bg}`}>
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${stage.dot}`} />
          <h3 className="text-sm font-bold text-slate-700">{stage.label}</h3>
        </div>
        <span className="text-[13px] font-bold text-slate-500 bg-white shadow-sm border border-slate-200 px-2.5 py-1 rounded-full">{leads.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3 custom-scrollbar">
        <SortableContext items={leads.map(l => l.id)}>
          {leads.map(lead => <LeadCard key={lead.id} lead={lead} onClick={() => onLeadClick(lead)} teamMembers={teamMembers} />)}
        </SortableContext>
      </div>
    </div>
  )
}

export default function PipelineClient({ initialLeads, teamMembers }: { initialLeads: Lead[], teamMembers: {id: string, full_name: string}[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [activeLead, setActiveLead] = useState<Lead | null>(null)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [periodFilter, setPeriodFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentLead, setCurrentLead] = useState<Partial<Lead>>({ customer_name: '', customer_phone: '', customer_email: '', customer_cpf: '', notes: '', vehicle_model: '', armor_type: '', quoted_value: 0, source: '', qualification_score: 50, assigned_to: '', type: 'blindagem' })
  
  const supabase = createClient()

  async function getOrgId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    return data?.organization_id ?? null
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragStart(event: DragStartEvent) {
    const lead = leads.find(l => l.id === event.active.id)
    if (lead) setActiveLead(lead)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveLead(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const overStage = STAGES.find(s => s.id === over.id)
    const overLead = leads.find(l => l.id === over.id)
    const newStage = overStage?.id || overLead?.pipeline_stage

    if (!newStage) return

    const now = new Date().toISOString()
    const updates: any = { pipeline_stage: newStage }
    
    // Updates para Etapa 1 do Tracker
    if (newStage === 'quoted') updates.quoted_date = now
    if (newStage === 'contracted' || newStage === 'lost') updates.closed_date = now

    setLeads(prev => prev.map(l => l.id === active.id ? { ...l, pipeline_stage: newStage } : l))
    await supabase.from('leads').update(updates).eq('id', active.id)
  }

  function openNewModal() {
    setIsEditing(false)
    setCurrentLead({ customer_name: '', customer_phone: '', customer_email: '', customer_cpf: '', notes: '', vehicle_model: '', armor_type: '', quoted_value: 0, source: '', qualification_score: 50, assigned_to: '', type: 'blindagem' })
    setShowModal(true)
  }

  function openEditModal(lead: Lead) {
    setIsEditing(true)
    setCurrentLead({ ...lead, type: lead.type || 'blindagem' })
    setShowModal(true)
  }

  async function handleSaveLead(e: React.FormEvent) {
    e.preventDefault()
    const orgId = await getOrgId()
    const updateData = {
      customer_name: currentLead.customer_name,
      customer_phone: currentLead.customer_phone || null,
      customer_email: currentLead.customer_email || null,
      customer_cpf: currentLead.customer_cpf || null,
      notes: currentLead.notes || null,
      vehicle_model: currentLead.vehicle_model || null,
      armor_type: currentLead.armor_type || null,
      quoted_value: currentLead.quoted_value ? Number(currentLead.quoted_value) : null,
      source: currentLead.source || null,
      qualification_score: Number(currentLead.qualification_score),
      assigned_to: currentLead.assigned_to || null,
      type: currentLead.type || 'blindagem'
    }
    
    if (isEditing && currentLead.id) {
      const { data, error } = await supabase.from('leads').update(updateData).eq('id', currentLead.id).select().single()
      if (!error && data) {
        setLeads(prev => prev.map(l => l.id === currentLead.id ? data as Lead : l))
        setShowModal(false)
      }
    } else {
      const { data, error } = await supabase.from('leads').insert({
        ...updateData,
        pipeline_stage: 'new',
        organization_id: orgId,
        prospect_date: new Date().toISOString()
      }).select().single()

      if (!error && data) {
        setLeads(prev => [data as Lead, ...prev])
        setShowModal(false)
      }
    }
  }

  async function handleConvertToProject() {
    if (!currentLead.id) return
    if (!confirm(`Deseja converter o lead ${currentLead.customer_name} em um Projeto de Produção?`)) return
    
    const orgId = await getOrgId()
    const { data: proj, error } = await supabase.from('projects').insert({
      customer_name: currentLead.customer_name,
      vehicle_model: currentLead.vehicle_model,
      plate: currentLead.plate || 'A Definir',
      lead_id: currentLead.id,
      contract_value: currentLead.quoted_value,
      organization_id: orgId,
      status: 'producao'
    }).select().single()

    if (!error && proj) {
      await supabase.from('leads').update({ pipeline_stage: 'contracted', closed_date: new Date().toISOString() }).eq('id', currentLead.id)
      setLeads(prev => prev.map(l => l.id === currentLead.id ? { ...l, pipeline_stage: 'contracted' } : l))
      setShowModal(false)
      alert("Projeto criado com sucesso! Visualize na aba de Projetos.")
    } else {
      alert("Erro ao converter em projeto.")
    }
  }

  // Filtragem (Etapa 1.1)
  const filteredLeads = useMemo(() => {
    let result = leads
    
    if (searchTerm) {
      result = result.filter(l => l.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
    }
    if (typeFilter !== 'all') {
      result = result.filter(l => (l.type || 'blindagem') === typeFilter)
    }

    if (periodFilter !== 'all') {
      const now = new Date()
      const startDate = new Date()
      if (periodFilter === 'current_month') {
        startDate.setDate(1)
        startDate.setHours(0,0,0,0)
      } else if (periodFilter === 'last_month') {
        startDate.setMonth(now.getMonth() - 1)
        startDate.setDate(1)
        startDate.setHours(0,0,0,0)
        const endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
        result = result.filter(l => {
          if (!l.created_at) return false
          const d = new Date(l.created_at)
          return d >= startDate && d <= endDate
        })
        return result // exit early
      } else if (periodFilter === '60d') {
        startDate.setDate(now.getDate() - 60)
      } else if (periodFilter === '90d') {
        startDate.setDate(now.getDate() - 90)
      }
      
      result = result.filter(l => {
        if (!l.created_at) return false
        return new Date(l.created_at) >= startDate
      })
    }

    return result
  }, [leads, searchTerm, periodFilter, typeFilter])

  // Metricas (Etapa 1.2)
  const metrics = useMemo(() => {
    const prospectados = filteredLeads.length
    const orcados = filteredLeads.filter(l => l.pipeline_stage === 'quoted' || l.pipeline_stage === 'contracted').length
    const fechados = filteredLeads.filter(l => l.pipeline_stage === 'contracted').length
    const conv = prospectados > 0 ? Math.round((fechados / prospectados) * 100) : 0
    const vBlindagem = filteredLeads.filter(l => (l.type || 'blindagem') === 'blindagem').length
    const vManutencao = filteredLeads.filter(l => l.type === 'manutencao').length
    return { prospectados, orcados, fechados, conv, vBlindagem, vManutencao }
  }, [filteredLeads])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      
      {/* HEADER DE FILTROS E MÉTRICAS */}
      <div className="mb-6 flex-shrink-0 bg-white rounded-3xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center mb-6">
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500">
               <Filter className="w-4 h-4 text-slate-500" />
               <select className="bg-transparent text-sm font-medium text-slate-700 outline-none pr-4" value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)}>
                 <option value="all">Todos os Períodos</option>
                 <option value="current_month">Mês Atual</option>
                 <option value="last_month">Mês Passado</option>
                 <option value="60d">Últimos 60 Dias</option>
                 <option value="90d">Últimos 90 Dias</option>
               </select>
             </div>
             <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500">
               <select className="bg-transparent text-sm font-medium text-slate-700 outline-none pr-4" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                 <option value="all">Todos Tipos</option>
                 <option value="blindagem">Somente Blindagem</option>
                 <option value="manutencao">Somente Manutenção</option>
               </select>
             </div>
             
             <input
               type="text"
               placeholder="Busca rápida..."
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               className="w-full max-w-[200px] px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
             />
          </div>
          <button className="btn-primary rounded-xl px-5 py-2.5 shadow-md shadow-indigo-200" onClick={openNewModal}>
            <Plus className="w-4 h-4" /> Novo Contato
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center">
            <p className="text-[13px] uppercase font-bold text-slate-500 tracking-wider">Prospectados</p>
            <p className="text-2xl font-black text-slate-800">{metrics.prospectados}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center">
            <p className="text-[13px] uppercase font-bold text-slate-500 tracking-wider">Orçados</p>
            <p className="text-2xl font-black text-blue-600">{metrics.orcados}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col justify-center">
            <p className="text-[13px] uppercase font-bold text-emerald-600 tracking-wider">Fechados</p>
            <p className="text-2xl font-black text-emerald-700">{metrics.fechados}</p>
          </div>
          <div className="p-3 bg-slate-900 rounded-2xl flex flex-col justify-center text-white">
            <p className="text-[13px] uppercase font-bold text-slate-400 tracking-wider">Conversão</p>
            <p className="text-2xl font-black">{metrics.conv}%</p>
          </div>
          <div className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center divide-x divide-slate-100">
             <div className="flex-1 flex flex-col items-center justify-center">
                <Shield className="w-4 h-4 text-indigo-600 mb-1" />
                <span className="text-[13px] font-bold text-slate-400">BLIN</span>
                <span className="text-sm font-black text-slate-800">{metrics.vBlindagem}</span>
             </div>
             <div className="flex-1 flex flex-col items-center justify-center">
                <Wrench className="w-4 h-4 text-amber-500 mb-1" />
                <span className="text-[13px] font-bold text-slate-400">MANUT</span>
                <span className="text-sm font-black text-slate-800">{metrics.vManutencao}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar">
        <div className="flex gap-6 h-full min-h-[500px] px-2 items-start">
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            {STAGES.map(stage => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                leads={filteredLeads.filter(l => l.pipeline_stage === stage.id)}
                onLeadClick={openEditModal}
                teamMembers={teamMembers}
              />
            ))}
            <DragOverlay>
              {activeLead ? <LeadCard lead={activeLead} isOverlay teamMembers={teamMembers} /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                {isEditing ? 'Detalhes do Contato' : 'Novo Contato'}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveLead} className="overflow-y-auto pr-2 pb-4 space-y-6 flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2">Nome do Cliente *</label>
                  <input
                    type="text" required
                    value={currentLead.customer_name}
                    onChange={e => setCurrentLead(prev => ({ ...prev, customer_name: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Negócio *</label>
                  <select
                    required
                    value={currentLead.type || 'blindagem'}
                    onChange={e => setCurrentLead(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium font-bold text-indigo-700"
                  >
                    <option value="blindagem">🛡️ Blindagem de Veículo</option>
                    <option value="manutencao">🔧 Manutenção / Revisão</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2">Telefone</label>
                  <input
                    type="tel"
                    value={currentLead.customer_phone || ''}
                    onChange={e => setCurrentLead(prev => ({ ...prev, customer_phone: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2">E-mail</label>
                  <input
                    type="email"
                    value={currentLead.customer_email || ''}
                    onChange={e => setCurrentLead(prev => ({ ...prev, customer_email: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2">CPF/CNPJ</label>
                  <input
                    type="text"
                    value={currentLead.customer_cpf || ''}
                    onChange={e => setCurrentLead(prev => ({ ...prev, customer_cpf: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2">Modelo do Veículo</label>
                  <input
                    type="text"
                    value={currentLead.vehicle_model || ''}
                    onChange={e => setCurrentLead(prev => ({ ...prev, vehicle_model: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2">Nível de Blindagem</label>
                  <input
                    type="text"
                    value={currentLead.armor_type || ''}
                    onChange={e => setCurrentLead(prev => ({ ...prev, armor_type: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2">Valor Orçado (R$)</label>
                  <input
                    type="number"
                    value={currentLead.quoted_value || ''}
                    onChange={e => setCurrentLead(prev => ({ ...prev, quoted_value: Number(e.target.value) }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-emerald-700"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2">Resp. pela Negociação</label>
                  <select
                    value={currentLead.assigned_to || ''}
                    onChange={e => setCurrentLead(prev => ({ ...prev, assigned_to: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  >
                    <option value="">Não atribuído</option>
                    {teamMembers?.map(t => (
                      <option key={t.id} value={t.id}>{t.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-3">Origem (Source)</label>
                    <select
                      value={currentLead.source || ''}
                      onChange={e => setCurrentLead(prev => ({ ...prev, source: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Selecione...</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Site/Formulário">Site / Formulário</option>
                      <option value="Indicação">Indicação</option>
                      <option value="Instagram/Meta">Instagram / Meta Ads</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-3">Termômetro ({currentLead.qualification_score}%)</label>
                      <input
                        type="range" min="0" max="100" step="10"
                        value={currentLead.qualification_score ?? 50}
                      onChange={e => setCurrentLead(prev => ({ ...prev, qualification_score: parseInt(e.target.value) }))}
                      className="w-full accent-indigo-500 mt-2"
                    />
                    <div className="flex justify-between text-[13px] uppercase font-bold text-slate-400 mt-1">
                      <span>Frio</span>
                      <span>Morno</span>
                      <span>Quente</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 flex-shrink-0">
                {isEditing && (
                  <button type="button" onClick={handleConvertToProject} className="flex-1 px-5 py-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-xl transition-colors border border-emerald-200">
                    ✨ Transformar em Projeto
                  </button>
                )}
                <div className="flex flex-1 gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-5 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary flex-1 justify-center rounded-xl py-3 text-sm">
                    {isEditing ? 'Salvar Edição' : 'Criar Contato'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
