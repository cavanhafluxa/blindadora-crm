import { 
  EllipsisHorizontalIcon,
  FunnelIcon,
  ChevronDownIcon,
  CurrencyDollarIcon,
  ReceiptPercentIcon,
  FireIcon,
  TruckIcon
} from "lucide-react"
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch data
  const { data: projects } = await supabase.from('projects').select('*')
  const { data: leads } = await supabase.from('leads').select('*')
  
  // Calculate specific KPIs
  const totalRevenue = projects?.reduce((acc, p) => acc + Number(p.contract_value), 0) || 0
  const activeChatCount = leads?.length || 0

  const kpis = [
    { 
      name: "Faturamento Vendas", 
      value: `R$ ${totalRevenue.toLocaleString('pt-BR')}`, 
      subtitle: `${projects?.length || 0} veículos vendidos`, 
      icon: CurrencyDollarIcon, 
      iconBg: "bg-amber-100/60", 
      iconColor: "text-amber-700",
      gradientColor: "bg-amber-200" 
    },
    { 
      name: "Estoque Disponível", 
      value: "R$ 0k", 
      subtitle: "Funcionalidade futura", 
      icon: TruckIcon, 
      iconBg: "bg-indigo-100/60", 
      iconColor: "text-indigo-700",
      gradientColor: "bg-indigo-200" 
    },
    { 
      name: "Comissões (vendidos)", 
      value: "R$ 0", 
      subtitle: "Depende de relatórios financeiros", 
      icon: ReceiptPercentIcon, 
      iconBg: "bg-emerald-100/60", 
      iconColor: "text-emerald-700",
      gradientColor: "bg-emerald-200" 
    },
    { 
      name: "Conversas Ativas (Leads)", 
      value: activeChatCount.toString(), 
      subtitle: `${activeChatCount} total no pipeline`, 
      icon: FireIcon, 
      iconBg: "bg-rose-100/60", 
      iconColor: "text-rose-700",
      gradientColor: "bg-rose-200" 
    },
  ]

  const teamMembers = [
    { name: "Usuario Ativo", role: user.email || 'Admin', time: "agora" },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#F3F5F8]">
      <div className="animate-in fade-in duration-700 w-full max-w-7xl mx-auto">
        
        {/* Page Header matching the image */}
        <div className="mb-8">
          <h2 className="text-[28px] font-bold text-slate-800 tracking-tight mb-1">Dashboard</h2>
          <p className="text-[13px] text-slate-500 font-medium">Visão geral do seu CRM automotivo. Bem-vindo(a)!</p>
        </div>

        {/* Top 4 KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map((kpi, i) => (
            <div key={kpi.name} className="soft-card p-6 flex flex-col justify-between group overflow-hidden relative cursor-default border-transparent hover:border-slate-100">
              {/* O Greadient Suave no canto superior direito igual a imagem */}
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full filter blur-3xl opacity-30 -mr-12 -mt-12 ${kpi.gradientColor}`}></div>
              
              <div className={`w-10 h-10 rounded-xl ${kpi.iconBg} flex items-center justify-center mb-6 relative z-10 transition-transform group-hover:scale-110`}>
                <kpi.icon className={`w-5 h-5 ${kpi.iconColor}`} />
              </div>

              <div className="relative z-10">
                <p className="text-[12px] font-semibold text-slate-500 mb-1.5 leading-none">{kpi.name}</p>
                <h3 className="text-[26px] font-bold text-slate-900 mb-1 leading-none tracking-tight">
                  {kpi.value}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium mt-2">
                  {kpi.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div className="lg:col-span-2 xl:col-span-3 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="soft-card p-6 flex flex-col hover:-translate-y-1 transition-transform duration-300">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-slate-800 font-semibold">Crescimento de Receita</h3>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-slate-50">
                    <span className="text-xs font-semibold text-slate-600">Este Mês</span>
                    <ChevronDownIcon className="w-3 h-3 text-slate-400" />
                  </div>
                </div>
                <div className="flex-1 min-h-[160px] flex items-center justify-center">
                  <span className="text-xs text-slate-400">Gráfico Dinâmico ficará aqui</span>
                </div>
              </div>

              <div className="soft-card p-6 flex flex-col relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-slate-800 font-semibold">Projetos Ativos</h3>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors">
                      <FunnelIcon className="w-3 h-3" /> Filter
                    </button>
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-end space-y-2">
                  {projects?.slice(0,4).map(p => (
                     <div key={p.id} className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                       {p.customer_name} - {p.plate}
                     </div>
                  ))}
                  {(!projects || projects.length === 0) && (
                     <span className="text-xs text-slate-400 align-center w-full block text-center">Nenhum projeto</span>
                  )}
                </div>
              </div>
              
            </div>
          </div>

          <div className="xl:col-span-1 space-y-6 flex flex-col">
            <div className="soft-card p-6 flex-1 hover-float border-transparent hover:border-slate-100">
              <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                <h3 className="text-slate-800 font-semibold">Equipe</h3>
              </div>
              <div className="space-y-5">
                {teamMembers.map((member, i) => (
                  <div key={member.name} className={`flex justify-between items-center group cursor-pointer ${i !== teamMembers.length - 1 ? 'border-b border-slate-50 pb-4' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-xs font-bold text-slate-500 flex items-center justify-center">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm text-slate-800 font-semibold">{member.name}</p>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">{member.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
