'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Shield, Mail, Key, User, Plus, X } from 'lucide-react'

type Profile = {
  id: string
  full_name: string
  role: string | null
  email?: string
}

export default function TeamClient({ initialProfiles }: { initialProfiles: Profile[] }) {
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles)
  const [showModal, setShowModal] = useState(false)
  const [newUser, setNewUser] = useState({ full_name: '', email: '', password: '', role: 'employee' })
  const supabase = createClient()

  async function getOrgId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    return data?.organization_id ?? null
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault()
    
    // In a real MVP with service_role, this would call a backend route to create the Auth user.
    // Here we will insert a mock profile for tracking assignment if backend fails,
    // but ideally you must create via supabase.auth.signUp() or admin api.
    
    // As a workaround to allow assigning this employee, we just insert into profiles.
    const orgId = await getOrgId()
    
    try {
      // 1. Simulating creation or actually using a backend API if we had one
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newUser, organization_id: orgId })
      })

      if (response.ok) {
        const data = await response.json()
        setProfiles(prev => [...prev, { id: data.user.id, full_name: newUser.full_name, role: newUser.role, email: newUser.email }])
        setShowModal(false)
        alert("Colaborador criado com sucesso! Ele já pode acessar o sistema.")
      } else {
        // Fallback: Just insert into profiles to allow assigning if no auth service key is available
        const { data, error } = await supabase.from('profiles').insert({
          id: crypto.randomUUID(), // fake id for MVP assignments without auth
          full_name: newUser.full_name,
          role: newUser.role,
          organization_id: orgId
        }).select().single()
        
        if (data) {
          setProfiles(prev => [...prev, data as Profile])
          setShowModal(false)
          alert("Colaborador adicionado para fins de atribuição (aviso: sem chave admin, login não ativado).")
        } else {
          alert("Erro ao adicionar colaborador.")
        }
      }
    } catch {
      alert("Erro ao conectar ao servidor.")
    }
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 mt-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Equipe e Acessos</h2>
          <p className="text-sm text-slate-500">Gerencie todos os colaboradores da sua empresa</p>
        </div>
        <button className="btn-primary rounded-xl px-5 py-2.5 shadow-md shadow-indigo-200" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Novo Colaborador
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-[13px] uppercase text-slate-500 font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Nome do usuário</th>
              <th className="px-6 py-4">E-mail de Acesso</th>
              <th className="px-6 py-4">Nível de Permissão</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {profiles.map(profile => (
              <tr key={profile.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white text-slate-800 flex items-center justify-center font-bold text-[13px] uppercase premium-avatar">
                    {profile.full_name.charAt(0)}
                  </div>
                  {profile.full_name}
                </td>
                <td className="px-6 py-4 text-slate-500">{profile.email || 'Não definido'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[13px] font-bold uppercase tracking-wider ${
                    profile.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {profile.role === 'admin' ? 'Administrador' : 'Colaborador'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1.5 text-[13px] font-bold text-emerald-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    Ativo
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Novo Colaborador</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2">Nome do usuário</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text" required
                    placeholder="João da Silva"
                    value={newUser.full_name}
                    onChange={e => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2">E-mail (Login)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email" required
                    placeholder="joao@empresa.com"
                    value={newUser.email}
                    onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2">Senha de Acesso</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password" required minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    value={newUser.password}
                    onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2">Nível de Permissão</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <select
                    value={newUser.role}
                    onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium appearance-none"
                  >
                    <option value="employee">Colaborador (Acesso Padrão)</option>
                    <option value="admin">Administrador (Acesso Total)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-5 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-[2] btn-primary justify-center rounded-xl py-3 text-sm flex items-center gap-2">
                  Criar Credenciais
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
