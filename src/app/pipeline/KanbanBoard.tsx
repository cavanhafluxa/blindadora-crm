'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent
} from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import Column from './Column'
import LeadCard from './LeadCard'
import { createClient } from '@/utils/supabase/client'

type Lead = {
  id: string
  customer_name: string
  plate: string
  vehicle_model: string
  armor_type: string
  quoted_value: number
  pipeline_stage: 'new' | 'prospecting' | 'quoted' | 'contracted'
}

type KanbanBoardProps = {
  initialLeads: Lead[]
}

const COLUMNS = [
  { id: 'new', title: 'NOVO', color: 'bg-red-500', bgLight: 'bg-red-50' },
  { id: 'prospecting', title: 'PROSPECÇÃO', color: 'bg-yellow-500', bgLight: 'bg-yellow-50' },
  { id: 'quoted', title: 'ORÇADO', color: 'bg-orange-500', bgLight: 'bg-orange-50' },
  { id: 'contracted', title: 'CONTRATADO', color: 'bg-green-500', bgLight: 'bg-green-50' }
]

export default function KanbanBoard({ initialLeads }: KanbanBoardProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [activeLead, setActiveLead] = useState<Lead | null>(null)
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const draggedLead = leads.find((l) => l.id === active.id)
    if (draggedLead) setActiveLead(draggedLead)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const isActiveALead = active.data.current?.type === 'Lead'
    const isOverALead = over.data.current?.type === 'Lead'
    const isOverAColumn = over.data.current?.type === 'Column'

    if (!isActiveALead) return

    setLeads((leads) => {
      const activeIndex = leads.findIndex((l) => l.id === activeId)
      const overIndex = leads.findIndex((l) => l.id === overId)

      if (isOverALead && leads[activeIndex].pipeline_stage !== leads[overIndex].pipeline_stage) {
        const newLeads = [...leads]
        newLeads[activeIndex].pipeline_stage = leads[overIndex].pipeline_stage
        return arrayMove(newLeads, activeIndex, overIndex)
      }

      if (isOverAColumn) {
        const newLeads = [...leads]
        newLeads[activeIndex].pipeline_stage = overId as Lead['pipeline_stage']
        return arrayMove(newLeads, activeIndex, overIndex !== -1 ? overIndex : newLeads.length)
      }

      return leads
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveLead(null)
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const newStage = active.data.current?.lead?.pipeline_stage

    // Salvar no Banco
    if (newStage) {
       await supabase
         .from('leads')
         .update({ pipeline_stage: newStage })
         .eq('id', activeId)
         
         // Se for para 'contracted', o trigger no backend N8N ou Supabase pode converter em Project
         // No caso do sistema local, faríamos um dispatch
    }
  }

  return (
    <div className="flex gap-6 h-full flex-nowrap items-start">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {COLUMNS.map((col) => {
          const colLeads = leads.filter((l) => l.pipeline_stage === col.id)
          return (
            <Column key={col.id} column={col} leads={colLeads}>
              <SortableContext items={colLeads.map((l) => l.id)}>
                {colLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
              </SortableContext>
            </Column>
          )
        })}

        <DragOverlay>
          {activeLead ? <LeadCard lead={activeLead} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
