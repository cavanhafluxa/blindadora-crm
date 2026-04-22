'use client'

import { useState } from 'react'
import { Milestone, ChevronDown, ChevronUp } from 'lucide-react'

export default function CollapsibleTimelineWrapper({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="soft-card p-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full group focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <Milestone className="w-5 h-5 text-slate-500" />
          <h2 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
            Linha do Tempo (Eventos)
          </h2>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600 transition-colors">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      
      {isOpen && (
        <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
          {children}
        </div>
      )}
    </div>
  )
}
