import { useMemo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import LeadCard from './LeadCard'

type ColumnProps = {
  column: {
    id: string
    title: string
    color: string
    bgLight: string
  }
  leads: any[]
  children: React.ReactNode
}

export default function Column({ column, leads, children }: ColumnProps) {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col flex-shrink-0 w-[300px] h-full max-h-full rounded-2xl border border-slate-200 overflow-hidden ${column.bgLight} shadow-sm`}
    >
      <div className="flex justify-between items-center p-4 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${column.color}`} />
          <h3 className="font-bold text-slate-800 text-sm tracking-wide">{column.title}</h3>
        </div>
        <div className="bg-slate-100 text-slate-600 font-bold text-xs px-2.5 py-1 rounded-full">
          {leads.length}
        </div>
      </div>
      
      <div className="flex-1 p-3 overflow-y-auto space-y-3">
        {children}
      </div>
    </div>
  )
}
