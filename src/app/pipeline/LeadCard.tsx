import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CarIcon, DollarSign, Fingerprint } from 'lucide-react'

type LeadCardProps = {
  lead: any
  isOverlay?: boolean
}

export default function LeadCard({ lead, isOverlay }: LeadCardProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.id,
    data: {
      type: 'Lead',
      lead,
    },
  })

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  }

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="w-full bg-white opacity-40 border-2 border-dashed border-[#22C55E] rounded-xl h-[120px]"
      />
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-slate-100 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-slate-300 transition-all ${
        isOverlay ? 'scale-105 shadow-xl rotate-1 cursor-grabbing' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-bold text-slate-800 text-base leading-tight truncate pr-2">
          {lead.customer_name}
        </h4>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-xs text-slate-600 font-medium bg-slate-50 w-fit px-2 py-1 rounded">
          <Fingerprint className="w-3 h-3 mr-1.5 text-slate-400" />
          <span className="uppercase">{lead.plate || 'SEM PLACA'}</span>
        </div>
        
        <div className="flex items-center text-xs text-slate-500">
          <CarIcon className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
          <span className="truncate">{lead.vehicle_model || 'Não definido'} 
            {lead.armor_type && <span className="ml-1 text-slate-400">({lead.armor_type})</span>}
          </span>
        </div>
      </div>
      
      <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs font-bold">
        <span className="text-slate-400">VALOR</span>
        <div className="flex items-center text-emerald-600">
          <DollarSign className="w-3.5 h-3.5 mr-0.5" />
          {Number(lead.quoted_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  )
}
