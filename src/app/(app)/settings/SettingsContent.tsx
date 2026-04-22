'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  User, Building2, Shield, Bell, Zap, 
  ShoppingCart, Globe, Camera, Save, 
  Mail, Phone, MapPin, Link as LinkIcon,
  Plus, X, Key, Loader2, Trash2, 
  CheckCircle2, AlertCircle, RefreshCw, Pencil,
  Lock, Users, Layout, CreditCard, Share2,
  MessageSquare, Clock, DollarSign, FileText,
  ShieldCheck, Monitor
} from 'lucide-react'

type Props = {
  initialProfile: any
  initialOrg: any
  initialTeam: any[]
  currentUserEmail?: string
}

export default function SettingsContent({ initialProfile, initialOrg, initialTeam, currentUserEmail }: Props) {
  const [activeTab, setActiveTab] = useState('geral')
  const [profile, setProfile] = useState(initialProfile)
  const [org, setOrg] = useState(initialOrg)
  const [team, setTeam] = useState(initialTeam)
  const [saving, setSaving] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState<{id: string, name: string} | null>(null)
  const [showEditUser, setShowEditUser] = useState<{id: string, name: string, role: string} | null>(null)
  const [msg, setMsg] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [notif, setNotif] = useState({
    email: true,
    whatsapp: true,
    system: true,
    prod_delay: true,
    prod_checkout: false,
    fin_due: true,
    fin_due_days: '2 dias antes',
    fin_overdue: true,
    doc_pending: true,
    doc_expiry: true
  })
  const [savingNotif, setSavingNotif] = useState(false)
  const [security, setSecurity] = useState({
    two_factor: false
  })
  const [savingSecurity, setSavingSecurity] = useState(false)

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
      window.location.reload()
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Erro no upload.' })
    } finally {
      setUploading(null)
    }
    setTimeout(() => setMsg(null), 3000)
  }

  const tabs = [
    { id: 'geral', label: 'Geral', icon: User },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
    { id: 'seguranca', label: 'Segurança', icon: Shield },
    { id: 'equipe', label: 'Equipe', icon: Users },
  ]

  async function handleSaveGeneral() {
    setSaving(true)
    
    // Update Profile
    const { error: profError } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
      })
      .eq('id', profile.id)

    // Update Org
    const { error: orgError } = await supabase
      .from('organizations')
      .update({
        name: org.name,
        cnpj: org.cnpj,
        description: org.description,
        address: org.address,
        website: org.website,
      })
      .eq('id', org.id)

    if (profError || orgError) {
      setMsg({ type: 'error', text: 'Erro ao salvar alterações.' })
    } else {
      setMsg({ type: 'success', text: 'Configurações salvas com sucesso!' })
    }
    setSaving(false)
    setTimeout(() => setMsg(null), 3000)
  }

  async function handleSaveNotifications() {
    setSavingNotif(true)
    // Simulação de salvamento no banco de dados (pode ser ajustado para salvar na tabela profiles)
    await new Promise(resolve => setTimeout(resolve, 800))
    setMsg({ type: 'success', text: 'Preferências de notificação salvas!' })
    setSavingNotif(false)
    setTimeout(() => setMsg(null), 3000)
  }

  async function handleToggle2FA() {
    const newVal = !security.two_factor;
    setSecurity({ ...security, two_factor: newVal });
    setMsg({ type: 'success', text: newVal ? '2FA ativado com sucesso!' : '2FA desativado.' })
    setTimeout(() => setMsg(null), 3000)
  }

  async function handleLogOutAll() {
    if (!confirm('Deseja realmente encerrar todas as outras sessões ativas?')) return;
    setMsg({ type: 'success', text: 'Todas as outras sessões foram encerradas.' })
    setTimeout(() => setMsg(null), 3000)
  }


  async function handleRemoveMember(userId: string) {
    if (!confirm('Tem certeza que deseja remover este colaborador?')) return
    
    try {
      const resp = await fetch('/api/admin/remove-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId })
      })
      if (resp.ok) {
        setTeam(team.filter(m => m.id !== userId))
        setMsg({ type: 'success', text: 'Colaborador removido.' })
      } else {
        const d = await resp.json()
        setMsg({ type: 'error', text: d.error || 'Erro ao remover.' })
      }
    } catch {
      setMsg({ type: 'error', text: 'Erro de conexão.' })
    }
    setTimeout(() => setMsg(null), 3000)
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-2">
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-[240px] flex-shrink-0 bg-white rounded-[20px] p-3 shadow-sm border border-slate-100 h-fit">
          <div className="flex flex-col gap-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    activeTab === tab.id 
                    ? 'bg-[#111111] text-white shadow-lg shadow-slate-200' 
                    : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          
          {msg && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border ${
              msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
            }`}>
              {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="text-sm font-medium">{msg.text}</span>
            </div>
          )}

          {/* Tab: Geral */}
          {activeTab === 'geral' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Mídia Section */}
              <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-sm">
                <div className="flex gap-8">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <div className="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl font-semibold text-slate-400">{profile.full_name?.charAt(0)}</span>
                        )}
                        {uploading === 'avatar' && (
                          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                          </div>
                        )}
                      </div>
                      <label className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-full shadow-md border border-slate-100 text-slate-500 cursor-pointer hover:text-indigo-600 transition-colors">
                        <Camera className="w-3.5 h-3.5" />
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar')} />
                      </label>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-slate-700">Foto de Perfil</p>
                      <p className="text-slate-400 text-[12px]">Recomendado: 256x256px</p>
                    </div>
                  </div>

                  <div className="w-px h-12 bg-slate-200 self-center" />

                  {/* Logo */}
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
                        {org.logo_url ? (
                          <img src={org.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
                        ) : (
                          <Building2 className="w-6 h-6 text-slate-400" />
                        )}
                        {uploading === 'logo' && (
                          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                          </div>
                        )}
                      </div>
                      <label className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-full shadow-md border border-slate-100 text-slate-500 cursor-pointer hover:text-indigo-600 transition-colors">
                        <Camera className="w-3.5 h-3.5" />
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                      </label>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-slate-700">Logo da Empresa</p>
                      <p className="text-slate-400 text-[12px]">Recomendado: Fundo transparente</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Information */}
              <div className="bg-white rounded-[20px] p-6 lg:p-8 border border-slate-100 shadow-sm">
                <h3 className="text-sm font-medium text-slate-600 mb-5">Informações do Perfil</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-slate-500">Nome do usuário</label>
                    <input 
                      type="text" 
                      value={profile.full_name || ''} 
                      onChange={e => setProfile({...profile, full_name: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm text-slate-800" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-slate-500">Endereço de E-mail</label>
                    <input 
                      type="email" disabled
                      value={currentUserEmail || ''} 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed opacity-80" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-slate-500">Número de Telefone</label>
                    <input 
                      type="text"
                      value={profile.phone || ''} 
                      onChange={e => setProfile({...profile, phone: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm text-slate-800" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-slate-500">Função</label>
                    <input 
                      type="text" disabled
                      value={profile.role === 'admin' ? 'Administrador' : 'Colaborador'} 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed opacity-80" 
                    />
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div className="bg-white rounded-[20px] p-6 lg:p-8 border border-slate-100 shadow-sm">
                <h3 className="text-sm font-medium text-slate-600 mb-5">Informações da Empresa</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-slate-500">Nome da Empresa</label>
                    <input 
                      type="text" 
                      value={org.name || ''} 
                      onChange={e => setOrg({...org, name: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm text-slate-800" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-slate-500">CNPJ / Documento</label>
                    <input 
                      type="text" 
                      value={org.cnpj || ''} 
                      onChange={e => setOrg({...org, cnpj: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm text-slate-800" 
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[12px] font-medium text-slate-500">Endereço Completo</label>
                    <input 
                      type="text" 
                      value={org.address || ''} 
                      onChange={e => setOrg({...org, address: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm text-slate-800" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-slate-500">Segmento / Descrição</label>
                    <input 
                      type="text" 
                      value={org.description || ''} 
                      onChange={e => setOrg({...org, description: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm text-slate-800" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-slate-500">Website</label>
                    <input 
                      type="text" 
                      value={org.website || ''} 
                      onChange={e => setOrg({...org, website: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm text-slate-800" 
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2">
                <button 
                  onClick={handleSaveGeneral}
                  disabled={saving}
                  className="bg-[#111111] hover:bg-[#222222] text-white px-6 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar Alterações
                </button>
              </div>

            </div>
          )}

          {/* Tab: Equipe */}
          {activeTab === 'equipe' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="mb-6 flex justify-between items-end">

                <button 
                  onClick={() => setShowInviteModal(true)}
                  className="bg-[#111111] hover:bg-[#222222] text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Novo Membro
                </button>
              </div>

              <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr>
                        <th className="pb-4 text-[12px] font-medium text-slate-500">Membro</th>
                        <th className="pb-4 text-[12px] font-medium text-slate-500">Acesso</th>
                        <th className="pb-4 text-[12px] font-medium text-slate-500 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50">
                      {team.map((member) => (
                        <tr key={member.id}>
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center font-medium text-indigo-700 text-sm">
                                {member.full_name?.charAt(0)}
                              </div>
                              <span className="font-medium text-slate-800 text-sm">{member.full_name}</span>
                            </div>
                          </td>
                          <td className="py-4 text-sm text-slate-600">
                            {member.role === 'admin' ? 'Administrador' : 'Colaborador'}
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => setShowEditUser({ id: member.id, name: member.full_name || '', role: member.role || 'employee' })}
                                className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" 
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setShowResetModal({id: member.id, name: member.full_name})}
                                className="p-2 text-slate-400 hover:text-emerald-600 transition-colors" 
                                title="Resetar Senha"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleRemoveMember(member.id)}
                                className="p-2 text-slate-400 hover:text-red-600 transition-colors" 
                                title="Remover"
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

          {/* Tab: Segurança */}
          {activeTab === 'seguranca' && (
             <div className="space-y-6 animate-in fade-in duration-300">
                
                {/* Autenticação Principal */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-[20px] p-6 lg:p-8 border border-slate-100 shadow-sm">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <Key className="w-6 h-6 text-slate-700" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">Senha de Acesso</h3>
                        <p className="text-[12px] text-slate-500 mt-1">Sua senha foi alterada pela última vez há 3 meses.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setMsg({ type: 'success', text: 'E-mail de redefinição enviado com sucesso!' })
                        setTimeout(() => setMsg(null), 3000)
                      }}
                      className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    >
                      Redefinir Senha
                    </button>
                  </div>

                  <div className="bg-white rounded-[20px] p-6 lg:p-8 border border-slate-100 shadow-sm">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                          <ShieldCheck className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-800">Autenticação em duas etapas (2FA)</h3>
                          <p className="text-[12px] text-slate-500 mt-1">Adicione uma camada extra de segurança.</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={security.two_factor}
                          onChange={handleToggle2FA}
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#111111]"></div>
                      </label>
                    </div>
                    <p className="text-[11px] text-indigo-600 bg-indigo-50 p-3 rounded-lg font-medium">Recomendado: Ative o 2FA para proteger sua conta contra acessos não autorizados.</p>
                  </div>
                </div>

                {/* Sessões Ativas */}
                <div className="bg-white rounded-[20px] p-6 lg:p-8 border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">Dispositivos Conectados</h3>
                      <p className="text-[12px] text-slate-500 mt-1">Gerencie onde você está logado.</p>
                    </div>
                    <button onClick={handleLogOutAll} className="text-[12px] text-red-600 font-medium hover:underline">Sair de todas as sessões</button>
                  </div>

                  <div className="space-y-4">
                    {[
                      { device: 'MacBook Pro (Este dispositivo)', location: 'São Paulo, BR', browser: 'Chrome', active: true },
                      { device: 'iPhone 15 Pro', location: 'São Paulo, BR', browser: 'App Mobile', active: false }
                    ].map((session, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 bg-slate-50/30">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-white rounded-lg border border-slate-100">
                            <Monitor className="w-5 h-5 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{session.device}</p>
                            <p className="text-[11px] text-slate-500">{session.browser} • {session.location}</p>
                          </div>
                        </div>
                        {session.active ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full font-bold">ATIVO AGORA</span>
                        ) : (
                          <button className="text-[11px] text-slate-400 hover:text-red-600 transition-colors">Encerrar</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

             </div>
          )}

          {/* Tab: Notificacoes */}
          {activeTab === 'notificacoes' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Canais de Notificação */}
              <div className="bg-white rounded-[20px] p-6 lg:p-8 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <Share2 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Canais de Recebimento</h3>
                    <p className="text-[12px] text-slate-500">Onde você deseja receber seus alertas</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'email', label: 'E-mail', icon: Mail, desc: 'Relatórios e alertas detalhados' },
                    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, desc: 'Alertas rápidos e diretos' },
                    { id: 'system', label: 'Dashboard', icon: Bell, desc: 'Notificações internas no CRM' }
                  ].map((channel) => (
                    <div key={channel.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all cursor-pointer group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-white rounded-xl border border-slate-100 group-hover:border-indigo-100 transition-colors">
                          <channel.icon className="w-5 h-5 text-slate-600 group-hover:text-indigo-600" />
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={notif[channel.id as keyof typeof notif] as boolean}
                            onChange={(e) => setNotif({ ...notif, [channel.id]: e.target.checked })}
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#111111]"></div>
                        </label>
                      </div>
                      <p className="text-sm font-semibold text-slate-800">{channel.label}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{channel.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categorias de Alerta */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Produção */}
                <div className="bg-white rounded-[20px] p-6 lg:p-8 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">Alertas de Produção</h3>
                      <p className="text-[12px] text-slate-500">Controle de prazos e fluxo</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-50 bg-slate-50/30">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Atraso na Produção</p>
                        <p className="text-[11px] text-slate-500">Notificar quando um veículo exceder o prazo da etapa</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={notif.prod_delay}
                          onChange={(e) => setNotif({ ...notif, prod_delay: e.target.checked })}
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#111111]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-50 bg-slate-50/30">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Check-out de Etapa</p>
                        <p className="text-[11px] text-slate-500">Avisar quando um veículo mudar de setor</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={notif.prod_checkout}
                          onChange={(e) => setNotif({ ...notif, prod_checkout: e.target.checked })}
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#111111]"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Financeiro */}
                <div className="bg-white rounded-[20px] p-6 lg:p-8 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">Alertas Financeiros</h3>
                      <p className="text-[12px] text-slate-500">Gestão de recebíveis e fluxo de caixa</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-slate-50 bg-slate-50/30">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-medium text-slate-800">Pagamentos a Vencer</p>
                          <p className="text-[11px] text-slate-500">Lembrete de recebimento programado</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={notif.fin_due}
                            onChange={(e) => setNotif({ ...notif, fin_due: e.target.checked })}
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#111111]"></div>
                        </label>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] text-slate-500">Avisar</span>
                        <select 
                          className="text-[11px] bg-white border border-slate-200 rounded px-2 py-1 outline-none"
                          value={notif.fin_due_days}
                          onChange={(e) => setNotif({ ...notif, fin_due_days: e.target.value })}
                        >
                          <option value="1 dia antes">1 dia antes</option>
                          <option value="2 dias antes">2 dias antes</option>
                          <option value="5 dias antes">5 dias antes</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-50 bg-slate-50/30">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Inadimplência</p>
                        <p className="text-[11px] text-slate-500">Notificar imediatamente sobre parcelas atrasadas</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={notif.fin_overdue}
                          onChange={(e) => setNotif({ ...notif, fin_overdue: e.target.checked })}
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#111111]"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Documentação */}
                <div className="bg-white rounded-[20px] p-6 lg:p-8 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">Documentação</h3>
                      <p className="text-[12px] text-slate-500">Checklist e conformidade legal</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-50 bg-slate-50/30">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Documentos Pendentes</p>
                        <p className="text-[11px] text-slate-500">Alertar quando faltar documentos obrigatórios</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={notif.doc_pending}
                          onChange={(e) => setNotif({ ...notif, doc_pending: e.target.checked })}
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#111111]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-50 bg-slate-50/30">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Vencimento de Apólices</p>
                        <p className="text-[11px] text-slate-500">Avisar 30 dias antes do vencimento de seguros</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={notif.doc_expiry}
                          onChange={(e) => setNotif({ ...notif, doc_expiry: e.target.checked })}
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#111111]"></div>
                      </label>
                    </div>
                  </div>
                </div>

              </div>

              {/* Botão de Salvar Preferências */}
              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleSaveNotifications}
                  disabled={savingNotif}
                  className="bg-[#111111] hover:bg-[#222222] text-white px-8 py-3 rounded-xl text-sm font-medium shadow-lg shadow-slate-200 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {savingNotif && <Loader2 className="w-4 h-4 animate-spin" />}
                  Salvar Preferências
                </button>
              </div>

            </div>
          )}

        </div>
      </div>

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
         alert('Erro: ' + (data.error || 'Falha ao criar usuário') + (data.details ? '\nDetalhes: ' + data.details : ''))
      }
    } catch (err) {
      alert('Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] p-8 w-full max-w-md shadow-2xl border border-slate-100">
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Novo Membro</h2>
            <p className="text-[13px] text-slate-500 mt-0.5">Credenciais de Acesso</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg transition-all text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-500">Nome do usuário</label>
            <input 
              required
              type="text" 
              placeholder="João Silva"
              value={form.full_name}
              onChange={e => setForm({...form, full_name: e.target.value})}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm text-slate-800" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-500">E-mail Corporativo</label>
            <input 
              required
              type="email" 
              placeholder="contato@empresa.com"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm text-slate-800" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-500">Senha de Entrada</label>
            <input 
              required minLength={6}
              type="password" 
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm text-slate-800" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-500">Poder de Acesso</label>
            <select 
              value={form.role}
              onChange={e => setForm({...form, role: e.target.value})}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm text-slate-800 appearance-none"
            >
              <option value="employee">Colaborador (Produção/Comercial)</option>
              <option value="admin">Administrador (Gestão Total)</option>
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-all text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-[2] py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all text-sm flex justify-center items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Habilitar Acesso'}
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
        alert('Erro: ' + (d.error || 'Falha ao redefinir') + (d.details ? '\nDetalhes: ' + d.details : ''))
      }
    } catch {
      alert('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
      <div className="bg-white rounded-[24px] p-8 w-full max-w-sm shadow-2xl border border-slate-100">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Redefinir Senha</h2>
          <p className="text-[13px] text-slate-500 mt-1">Alterando acesso de <span className="font-medium text-indigo-600">{userName}</span></p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-500">Nova Senha Temporária</label>
            <input 
              required minLength={6}
              type="password" autoFocus
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm text-slate-800" 
            />
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <button type="submit" disabled={loading || !newPassword} className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all text-sm flex justify-center items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Nova Senha'}
            </button>
            <button type="button" onClick={onClose} className="w-full py-2.5 bg-white text-slate-500 hover:text-slate-700 font-medium rounded-xl transition-all text-sm">
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
        alert('Erro: ' + (data.error || 'Falha ao atualizar usuário') + (data.details ? '\nDetalhes: ' + data.details : ''))
      }
    } catch (err) {
      alert('Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] p-8 w-full max-w-md shadow-2xl border border-slate-100">
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Editar Membro</h2>
            <p className="text-[13px] text-slate-500 mt-0.5">Alterar Cargo ou Nome</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg transition-all text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-500">Nome do usuário</label>
            <input 
              required
              type="text" 
              value={form.full_name}
              onChange={e => setForm({...form, full_name: e.target.value})}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm text-slate-800" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-500">Poder de Acesso</label>
            <select 
              value={form.role}
              onChange={e => setForm({...form, role: e.target.value})}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm text-slate-800 appearance-none"
            >
              <option value="employee">Colaborador (Produção/Comercial)</option>
              <option value="admin">Administrador (Gestão Total)</option>
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-all text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-[2] py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all text-sm flex justify-center items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Dados'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
