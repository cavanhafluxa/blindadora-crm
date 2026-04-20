'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  User, Building2, Shield, Bell, Zap, 
  ShoppingCart, Globe, Camera, Save, 
  Mail, Phone, MapPin, Link as LinkIcon,
  Plus, X, Key, Loader2, Trash2, 
  CheckCircle2, AlertCircle, RefreshCw, Pencil
} from 'lucide-react'

type Props = {
  initialProfile: any
  initialOrg: any
  initialTeam: any[]
  currentUserEmail?: string
}

export default function SettingsContent({ initialProfile, initialOrg, initialTeam, currentUserEmail }: Props) {
  const [activeTab, setActiveTab] = useState('perfil')
  const [profile, setProfile] = useState(initialProfile)
  const [org, setOrg] = useState(initialOrg)
  const [team, setTeam] = useState(initialTeam)
  const [saving, setSaving] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState<{id: string, name: string} | null>(null)
  const [showEditUser, setShowEditUser] = useState<{id: string, name: string, role: string} | null>(null)
  const [msg, setMsg] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)

  const supabase = createClient()

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'logo') {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(type)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${type}_${Math.random()}.${fileExt}`
      const filePath = `${type}s/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('org-assets')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('org-assets')
        .getPublicUrl(filePath)

      if (type === 'avatar') {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', profile.id)
        if (updateError) throw updateError
        setProfile({ ...profile, avatar_url: publicUrl })
      } else {
        const { error: updateError } = await supabase
          .from('organizations')
          .update({ logo_url: publicUrl })
          .eq('id', org.id)
        if (updateError) throw updateError
        setOrg({ ...org, logo_url: publicUrl })
      }

      setMsg({ type: 'success', text: 'Imagem atualizada com sucesso!' })
      // Forçar atualização global para o Sidebar refletir a mudança
      window.location.reload()
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Erro no upload.' })
    } finally {
      setUploading(null)
    }
    setTimeout(() => setMsg(null), 3000)
  }

  const tabs = [
    { id: 'perfil', label: 'Perfil', icon: User },
    { id: 'loja', label: 'Dados da Loja', icon: Building2 },
    { id: 'equipe', label: 'Equipe e Acessos', icon: Shield },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
  ]

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
      })
      .eq('id', profile.id)

    if (error) setMsg({ type: 'error', text: 'Erro ao atualizar perfil.' })
    else setMsg({ type: 'success', text: 'Perfil atualizado com sucesso!' })
    setSaving(false)
    setTimeout(() => setMsg(null), 3000)
  }

  async function handleUpdateOrg(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase
      .from('organizations')
      .update({
        name: org.name,
        cnpj: org.cnpj,
        address: org.address,
        website: org.website,
      })
      .eq('id', org.id)

    if (error) setMsg({ type: 'error', text: 'Erro ao atualizar dados da loja.' })
    else setMsg({ type: 'success', text: 'Dados da loja atualizados!' })
    setSaving(false)
    setTimeout(() => setMsg(null), 3000)
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm('Tem certeza que deseja remover este colaborador? O acesso será revogado imediatamente.')) return
    
    try {
      const resp = await fetch('/api/admin/remove-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId })
      })
      if (resp.ok) {
        setTeam(team.filter(m => m.id !== userId))
        setMsg({ type: 'success', text: 'Colaborador removido com sucesso.' })
      } else {
        const d = await resp.json()
        setMsg({ type: 'error', text: d.error || 'Erro ao remover colaborador.' })
      }
    } catch {
      setMsg({ type: 'error', text: 'Erro de conexão.' })
    }
    setTimeout(() => setMsg(null), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                isActive 
                  ? 'bg-white text-slate-900 shadow-sm scale-105' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {msg && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border ${
          msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-bold">{msg.text}</span>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'perfil' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="soft-card p-8">
              <div className="flex items-center gap-6 mb-8">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-3xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-black shadow-inner overflow-hidden border-4 border-white shadow-xl">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      profile.full_name?.charAt(0) || 'U'
                    )}
                    {uploading === 'avatar' && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                      </div>
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 p-2.5 bg-white rounded-xl shadow-xl border border-slate-100 text-slate-500 hover:text-indigo-600 transition-all hover:scale-110 cursor-pointer">
                    <Camera className="w-4 h-4" />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'avatar')}
                    />
                  </label>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{profile.full_name}</h2>
                  <p className="text-slate-500 font-bold">{currentUserEmail}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider">
                      {profile.role === 'admin' ? 'Administrador' : 'Colaborador'}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider">
                      Ativo
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={profile.full_name || ''} 
                        onChange={e => setProfile({...profile, full_name: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-700" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail de Acesso</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="email" disabled
                        value={currentUserEmail || ''} 
                        className="w-full pl-12 pr-4 py-4 bg-slate-100 border border-slate-100 rounded-2xl text-slate-400 cursor-not-allowed font-bold" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="+55 11 99999-0000"
                        value={profile.phone || ''} 
                        onChange={e => setProfile({...profile, phone: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-700" 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-50">
                  <button type="submit" disabled={saving} className="btn-primary px-8 h-[56px] rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-100">
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          <div className="space-y-6 text-sm">
             <div className="soft-card p-6 bg-indigo-900 border-none text-white">
                <Shield className="w-10 h-10 text-indigo-400 mb-4" />
                <h3 className="text-lg font-black tracking-tight mb-2">Segurança da Conta</h3>
                <p className="text-indigo-200 font-medium mb-6">Deseja alterar sua senha de acesso ou configurar autenticação em dois fatores?</p>
                <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-white/10">
                   <Key className="w-4 h-4" /> Gerenciar Senha
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Loja Tab */}
      {activeTab === 'loja' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="soft-card p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-indigo-500" /> Dados da Empresa
                  </h2>
                  <p className="text-slate-500 font-medium">Informações legais e de contato da sua blindadora.</p>
                </div>
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 overflow-hidden relative">
                    {org.logo_url ? (
                      <img src={org.logo_url} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-8 h-8" />
                    )}
                    {uploading === 'logo' && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                      </div>
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 p-1.5 bg-white rounded-lg shadow-lg border border-slate-100 text-slate-500 hover:text-indigo-600 transition-all cursor-pointer">
                    <Camera className="w-3.5 h-3.5" />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'logo')}
                    />
                  </label>
                </div>
              </div>

              <form onSubmit={handleUpdateOrg} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Loja / Razão Social</label>
                    <input 
                      type="text" 
                      value={org.name || ''} 
                      onChange={e => setOrg({...org, name: e.target.value})}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-700" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ</label>
                    <input 
                      type="text" 
                      placeholder="00.000.000/0001-00"
                      value={org.cnpj || ''} 
                      onChange={e => setOrg({...org, cnpj: e.target.value})}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-700" 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço Administrativo</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Rua, Número, Bairro, Cidade - UF"
                        value={org.address || ''} 
                        onChange={e => setOrg({...org, address: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-700" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Website Oficial</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="https://www.blindadora.com.br"
                        value={org.website || ''} 
                        onChange={e => setOrg({...org, website: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-700" 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end pt-6 border-t border-slate-50">
                  <button type="submit" disabled={saving} className="btn-primary px-10 h-[56px] rounded-2xl flex items-center gap-2">
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Salvar Dados da Empresa
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Equipe Tab */}
      {activeTab === 'equipe' && (
        <div className="space-y-6">
          <div className="soft-card p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Shield className="w-6 h-6 text-indigo-500" /> Equipe e Acessos
                </h2>
                <p className="text-slate-500 font-medium mt-1">Gerencie logins e permissões de toda a sua equipe em um só lugar.</p>
              </div>
              <button 
                onClick={() => setShowInviteModal(true)}
                className="btn-primary rounded-2xl px-6 py-3.5 flex items-center gap-2 shadow-xl shadow-indigo-100 transition-transform active:scale-95"
              >
                <Plus className="w-5 h-5" /> Novo Colaborador
              </button>
            </div>

            <div className="overflow-hidden rounded-[32px] border border-slate-100 shadow-sm bg-white">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                    <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Acesso</th>
                    <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Controle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {team.map((member) => (
                    <tr key={member.id} className="group hover:bg-slate-50/50 transition-all">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-600 text-lg shadow-inner group-hover:bg-white transition-colors">
                            {member.full_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 leading-tight">{member.full_name}</p>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">Membro ativo</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                          member.role === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {member.role === 'admin' ? 'Administrador' : 'Colaborador'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setShowEditUser({ id: member.id, name: member.full_name || '', role: member.role || 'employee' })}
                            className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 shadow-sm transition-all" 
                            title="Editar Colaborador"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setShowResetModal({id: member.id, name: member.full_name})}
                            className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 shadow-sm transition-all" 
                            title="Resetar Senha"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 shadow-sm transition-all" 
                            title="Remover Acesso"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Notificações Placeholder */}
      {activeTab === 'notificacoes' && (
        <div className="soft-card p-16 flex flex-col items-center justify-center text-center">
           <Bell className="w-16 h-16 text-slate-200 mb-6 drop-shadow-xl" />
           <h3 className="text-2xl font-black text-slate-800 tracking-tight">Centro de Alertas</h3>
           <p className="text-slate-500 font-medium max-w-sm mt-2">Em breve você poderá configurar alertas de WhatsApp e E-mail para revisões e projetos.</p>
           <button className="mt-8 px-6 py-3 bg-slate-100 text-slate-400 rounded-2xl font-bold cursor-not-allowed">Configurar Webhooks</button>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal 
          onClose={() => setShowInviteModal(false)} 
          onSuccess={(u: any) => {
            setTeam([...team, u])
            setMsg({ type: 'success', text: 'Convite enviado e usuário criado!' })
            setTimeout(() => setMsg(null), 3000)
          }}
        />
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <ResetPasswordModal 
          userId={showResetModal.id}
          userName={showResetModal.name}
          onClose={() => setShowResetModal(null)} 
          onSuccess={() => {
            setMsg({ type: 'success', text: `Senha de ${showResetModal.name} alterada!` })
            setTimeout(() => setMsg(null), 3000)
          }}
        />
      )}

      {/* Edit User Modal */}
      {showEditUser && (
        <EditUserModal 
          userId={showEditUser.id}
          userName={showEditUser.name}
          initialRole={showEditUser.role}
          onClose={() => setShowEditUser(null)} 
          onSuccess={(newName, newRole) => {
            setTeam(team.map(m => m.id === showEditUser.id ? { ...m, full_name: newName, role: newRole } : m))
            setMsg({ type: 'success', text: `Dados de ${newName} atualizados!` })
            setTimeout(() => setMsg(null), 3000)
          }}
        />
      )}
    </div>
  )
}

function InviteModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: (u: any) => void }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'employee' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const resp = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await resp.json()
      if (resp.ok) {
        onSuccess({
          id: data.user.id,
          full_name: form.full_name,
          role: form.role,
          created_at: new Date().toISOString()
        })
        onClose()
      } else {
         alert('Erro: ' + (data.error || 'Falha ao criar usuário'))
      }
    } catch (err) {
      alert('Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] p-10 w-full max-w-md shadow-2xl relative border border-slate-100 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Novo Membro</h2>
            <p className="text-[11px] font-black text-slate-400 mt-1 uppercase tracking-widest">Credenciais de Acesso</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-all">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
            <input 
              required
              type="text" 
              placeholder="João Silva"
              value={form.full_name}
              onChange={e => setForm({...form, full_name: e.target.value})}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-800" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
            <input 
              required
              type="email" 
              placeholder="contato@empresa.com"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-800" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha de Entrada</label>
            <div className="relative">
               <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                required minLength={6}
                type="password" 
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-800" 
                />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Poder de Acesso</label>
            <select 
              value={form.role}
              onChange={e => setForm({...form, role: e.target.value})}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-800 appearance-none"
            >
              <option value="employee">Colaborador (Produção/Comercial)</option>
              <option value="admin">Administrador (Gestão Total)</option>
            </select>
          </div>

          <div className="pt-6 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-black uppercase text-xs tracking-widest text-slate-400 hover:text-slate-600 transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-[2] btn-primary py-4 rounded-[20px] flex items-center justify-center gap-2 shadow-xl shadow-indigo-100">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Habilitar Acesso
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ResetPasswordModal({ userId, userName, onClose, onSuccess }: { userId: string, userName: string, onClose: () => void, onSuccess: () => void }) {
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const resp = await fetch('/api/admin/reset-user-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId, newPassword })
      })
      if (resp.ok) {
        onSuccess()
        onClose()
      } else {
        const d = await resp.json()
        alert('Erro: ' + (d.error || 'Falha ao redefinir'))
      }
    } catch {
      alert('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in zoom-in-95 duration-200">
      <div className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl border border-slate-100">
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Redefinir Senha</h2>
          <p className="text-sm text-slate-500 font-medium">Alterando acesso de <span className="font-bold text-indigo-600">{userName}</span></p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nova Senha Temporária</label>
            <input 
              required minLength={6}
              type="password" autoFocus
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-800" 
            />
          </div>
          <div className="flex flex-col gap-2 pt-4">
            <button type="submit" disabled={loading || !newPassword} className="btn-primary py-4 rounded-2xl flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Key className="w-5 h-5" />}
              Confirmar Nova Senha
            </button>
            <button type="button" onClick={onClose} className="py-3 text-sm font-bold text-slate-400 hover:text-red-500 transition-colors">
              Desistir
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditUserModal({ userId, userName, initialRole, onClose, onSuccess }: { 
  userId: string, 
  userName: string, 
  initialRole: string,
  onClose: () => void, 
  onSuccess: (name: string, role: string) => void 
}) {
  const [form, setForm] = useState({ full_name: userName, role: initialRole })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const resp = await fetch('/api/admin/update-user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId, ...form })
      })
      const data = await resp.json()
      if (resp.ok) {
        onSuccess(form.full_name, form.role)
        onClose()
      } else {
        alert('Erro: ' + (data.error || 'Falha ao atualizar usuário'))
      }
    } catch (err) {
      alert('Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] p-10 w-full max-w-md shadow-2xl relative border border-slate-100 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600" />
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Editar Membro</h2>
            <p className="text-[11px] font-black text-slate-400 mt-1 uppercase tracking-widest">Alterar Cargo ou Nome</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-all">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
            <input 
              required
              type="text" 
              value={form.full_name}
              onChange={e => setForm({...form, full_name: e.target.value})}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-800" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Poder de Acesso</label>
            <select 
              value={form.role}
              onChange={e => setForm({...form, role: e.target.value})}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-800 appearance-none"
            >
              <option value="employee">Colaborador (Produção/Comercial)</option>
              <option value="admin">Administrador (Gestão Total)</option>
            </select>
          </div>

          <div className="pt-6 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-black uppercase text-xs tracking-widest text-slate-400 hover:text-slate-600 transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-[2] btn-primary py-4 rounded-[20px] flex items-center justify-center gap-2 shadow-xl shadow-blue-100">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Salvar Dados
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
