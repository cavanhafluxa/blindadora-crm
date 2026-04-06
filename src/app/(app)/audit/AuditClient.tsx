'use client'

import { useState } from 'react'
import { FileText, Clock, User as UserIcon } from 'lucide-react'

type AuditLog = {
  id: string
  action: string
  entity_type: string
  entity_id: string
  created_at: string
  profiles?: { full_name: string } | null
}

export default function AuditClient({ initialLogs }: { initialLogs: AuditLog[] }) {
  const [logs] = useState<AuditLog[]>(initialLogs)

  // Map entity types to friendly names
  const entityMap: Record<string, string> = {
    'lead': 'Contato / Lead',
    'project': 'Projeto',
    'stage_photo': 'Evidência (Produção)',
    'financial': 'Registro Financeiro',
    'profile': 'Colaborador'
  }

  // Define action styles
  function getActionStyle(action: string) {
    if (action.includes('create') || action.includes('add') || action.includes('insert')) {
      return 'bg-emerald-100 text-emerald-700'
    }
    if (action.includes('delete') || action.includes('remove')) {
      return 'bg-red-100 text-red-700'
    }
    return 'bg-blue-100 text-blue-700' // update, modify, edit
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 mt-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Histórico de Alterações</h2>
          <p className="text-sm text-slate-500">Acompanhe quem fez o quê no sistema</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Data e Hora</th>
              <th className="px-6 py-4">Usuário</th>
              <th className="px-6 py-4">Ação Realizada</th>
              <th className="px-6 py-4">Módulo afetado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                  Nenhum registro encontrado no histórico.
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-500 flex items-center gap-2 font-medium">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {new Date(log.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      {log.profiles?.full_name || 'Sistema / Anonimo'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getActionStyle(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      {entityMap[log.entity_type] || log.entity_type}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
