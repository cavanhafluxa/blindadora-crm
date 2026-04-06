'use client'

import { useState, useCallback } from 'react'
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
import { Car, Phone, DollarSign, Plus, X } from 'lucide-react'

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
}

const STAGES = [
  { id: 'new', label: 'NOVO', dot: 'bg-red-500', bg: 'bg-red-50', border: 'border-red-200' },
  { id: 'prospecting', label: 'PROSPECÇÃO', dot: 'bg-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { id: 'quoted', label: 'ORÇADO', dot: 'bg-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' },
  { id: 'contracted', label: 'CONTRATADO', dot: 'bg-green-500', bg: 'bg-green-50', border: 'border-green-200' },
]

function LeadCard({ lead, isOverlay }: { lead: Lead; isOverlay?: boolean }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { type: 'lead', lead },
  })

  const style = { transition, transform: CSS.Transform.toString(transform) }

  if (isDragging) {
    return <div ref={setNodeRef} style={style} className="h-24 rounded-xl border-2 border-dashed border-green-300 bg-green-50/50" />
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-xl p-4 shadow-sm border border-slate-100 cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${isOverlay ? 'rotate-1 shadow-xl scale-105' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <p className="font-semibold text-slate-800 text-sm truncate flex-1">{lead.customer_name}</p>
        {lead.qualification_score !== undefined && lead.qualification_score !== null && (
          <span title={`Score: ${lead.qualification_score}`} className="text-xs px-1.5 py-0.5 rounded flex-shrink-0 ml-2 shadow-sm border border-slate-200" style={{
            backgroundColor: lead.qualification_score > 70 ? '#fef2f2' : lead.qualification_score > 30 ? '#fefce8' : '#f8fafc',
            color: lead.qualification_score > 70 ? '#ef4444' : lead.qualification_score > 30 ? '#eab308' : '#64748b'
          }}>
            {lead.qualification_score > 70 ? '🔥' : lead.qualification_score > 30 ? '⚡' : '❄️'}
          </span>
        )}
      </div>
      {lead.vehicle_model && (
        <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
          <Car className="w-3 h-3" />
          <span className="truncate">{lead.vehicle_model} {lead.armor_type ? `(${lead.armor_type})` : ''}</span>
        </div>
      )}
      {lead.customer_phone && (
        <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
          <Phone className="w-3 h-3" />
          <span>{lead.customer_phone}</span>
        </div>
      )}
      {lead.source && (
        <div className="text-[10px] uppercase font-bold text-slate-400 mt-2 mb-1">
          Origem: {lead.source}
        </div>
      )}
      {lead.quoted_value && (
        <div className="flex items-center gap-1 text-xs font-bold text-green-600 mt-2 pt-2 border-t border-slate-100">
          <DollarSign className="w-3 h-3" />
          <span>R$ {Number(lead.quoted_value).toLocaleString('pt-BR')}</span>
        </div>
      )}
    </div>
  )
}

function KanbanColumn({ stage, leads }: { stage: typeof STAGES[0]; leads: Lead[] }) {
  const { setNodeRef } = useSortable({ id: stage.id, data: { type: 'column' } })

  return (
    <div ref={setNodeRef} className={`flex-shrink-0 w-[280px] h-full flex flex-col rounded-2xl border ${stage.border} ${stage.bg}`}>
      <div className="flex items-center justify-between px-4 py-3 bg-white/80 rounded-t-2xl border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${stage.dot}`} />
          <h3 className="text-xs font-bold text-slate-600 tracking-wider">{stage.label}</h3>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{leads.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <SortableContext items={leads.map(l => l.id)}>
          {leads.map(lead => <LeadCard key={lead.id} lead={lead} />)}
        </SortableContext>
      </div>
    </div>
  )
}

export default function PipelineClient({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [activeLead, setActiveLead] = useState<Lead | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [newLead, setNewLead] = useState({ customer_name: '', customer_phone: '', vehicle_model: '', armor_type: '', quoted_value: '', source: '', qualification_score: 50 })
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

    setLeads(prev => prev.map(l => l.id === active.id ? { ...l, pipeline_stage: newStage } : l))
    await supabase.from('leads').update({ pipeline_stage: newStage }).eq('id', active.id)

    // If moved to contracted, offer to create project
    if (newStage === 'contracted') {
      const movedLead = leads.find(l => l.id === active.id)
      if (movedLead && confirm(`Deseja criar um projeto de blindagem para ${movedLead.customer_name}?`)) {
        const orgId = await getOrgId()
        await supabase.from('projects').insert({
          customer_name: movedLead.customer_name,
          vehicle_model: movedLead.vehicle_model,
          lead_id: movedLead.id,
          contract_value: movedLead.quoted_value,
          organization_id: orgId,
        })
      }
    }
  }

  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault()
    const orgId = await getOrgId()
    const { data, error } = await supabase.from('leads').insert({
      customer_name: newLead.customer_name,
      customer_phone: newLead.customer_phone || null,
      vehicle_model: newLead.vehicle_model || null,
      armor_type: newLead.armor_type || null,
      quoted_value: newLead.quoted_value ? Number(newLead.quoted_value) : null,
      source: newLead.source || null,
      qualification_score: Number(newLead.qualification_score),
      pipeline_stage: 'new',
      organization_id: orgId,
    }).select().single()

    if (!error && data) {
      setLeads(prev => [data as Lead, ...prev])
      setShowModal(false)
      setNewLead({ customer_name: '', customer_phone: '', vehicle_model: '', armor_type: '', quoted_value: '', source: '', qualification_score: 50 })
    }
  }

  return (
    <>
      {/* Add Lead Button Wiring */}
      <div className="flex justify-end mb-4 flex-shrink-0">
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Novo Lead
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 h-full min-h-[500px]">
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            {STAGES.map(stage => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                leads={leads.filter(l => l.pipeline_stage === stage.id)}
              />
            ))}
            <DragOverlay>
              {activeLead ? <LeadCard lead={activeLead} isOverlay /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* New Lead Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">Novo Lead</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddLead} className="space-y-4">
              {[
                { name: 'customer_name', label: 'Nome do Cliente *', type: 'text', required: true, placeholder: 'João Silva' },
                { name: 'customer_phone', label: 'Telefone', type: 'tel', required: false, placeholder: '(11) 99999-9999' },
                { name: 'vehicle_model', label: 'Modelo do Veículo', type: 'text', required: false, placeholder: 'Toyota Hilux SW4' },
                { name: 'armor_type', label: 'Nível de Blindagem', type: 'text', required: false, placeholder: 'IIIA' },
                { name: 'quoted_value', label: 'Valor Orçado (R$)', type: 'number', required: false, placeholder: '150000' },
              ].map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    required={field.required}
                    placeholder={field.placeholder}
                    value={newLead[field.name as keyof typeof newLead]}
                    onChange={e => setNewLead(prev => ({ ...prev, [field.name]: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ))}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Origem do Lead</label>
                <select
                  value={newLead.source}
                  onChange={e => setNewLead(prev => ({ ...prev, source: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  <option value="">Selecione...</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Site/Formulário">Site / Formulário</option>
                  <option value="Indicação">Indicação</option>
                  <option value="Instagram/Meta">Instagram / Meta Ads</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Qualificação / Interesse <span className="text-slate-400 font-normal">({newLead.qualification_score}%)</span></label>
                <input
                  type="range" min="0" max="100" step="10"
                  value={newLead.qualification_score}
                  onChange={e => setNewLead(prev => ({ ...prev, qualification_score: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1 justify-center">
                  Criar Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
