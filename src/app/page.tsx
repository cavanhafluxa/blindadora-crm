import { 
  EllipsisHorizontalIcon,
  FunnelIcon,
  ChevronDownIcon,
  CurrencyDollarIcon,
  PresentationChartLineIcon,
  ReceiptPercentIcon,
  FireIcon,
  TruckIcon
} from "@heroicons/react/24/outline";

export default function Home() {
  const kpis = [
    { 
      name: "Faturamento Vendas", 
      value: "R$ 0", 
      subtitle: "0 veículos vendidos", 
      icon: CurrencyDollarIcon, 
      iconBg: "bg-amber-100/60", 
      iconColor: "text-amber-700",
      gradientColor: "bg-amber-200" 
    },
    { 
      name: "Estoque Disponível", 
      value: "R$ 2000k", 
      subtitle: "1 veículos · 0 reservados", 
      icon: TruckIcon, 
      iconBg: "bg-indigo-100/60", 
      iconColor: "text-indigo-700",
      gradientColor: "bg-indigo-200" 
    },
    { 
      name: "Comissões (vendidos)", 
      value: "R$ 0", 
      subtitle: "Média: R$ 342.000 / veículo", 
      icon: ReceiptPercentIcon, 
      iconBg: "bg-emerald-100/60", 
      iconColor: "text-emerald-700",
      gradientColor: "bg-emerald-200" 
    },
    { 
      name: "Conversas Ativas", 
      value: "0", 
      subtitle: "0 total no sistema", 
      icon: FireIcon, 
      iconBg: "bg-rose-100/60", 
      iconColor: "text-rose-700",
      gradientColor: "bg-rose-200" 
    },
  ];

  const teamMembers = [
    { name: "Carlos M.", role: "Gerente Vendas", time: "2 min ago" },
    { name: "Ana P.", role: "Pós-Venda", time: "2 min ago" },
    { name: "Julio C.", role: "Chefe Produção", time: "2 min ago" },
    { name: "Ricardo B.", role: "Financeiro", time: "2 min ago" },
  ];

  return (
    <div className="animate-in fade-in duration-700 w-full">
      
      {/* Page Header matching the image */}
      <div className="mb-8">
        <h2 className="text-[28px] font-bold text-slate-800 tracking-tight mb-1">Dashboard</h2>
        <p className="text-[13px] text-slate-500 font-medium">Visão geral do seu CRM automotivo</p>
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
          {/* Main Charts Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="soft-card p-6 flex flex-col hover:-translate-y-1 transition-transform duration-300">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-slate-800 font-semibold">Crescimento de Receita</h3>
                <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-slate-50">
                  <span className="text-xs font-semibold text-slate-600">Este Mês</span>
                  <ChevronDownIcon className="w-3 h-3 text-slate-400" />
                </div>
              </div>
              
              <div className="flex-1 min-h-[160px] flex items-end justify-between relative mt-4">
                {/* Mock Chart Line */}
                <div className="absolute inset-0 top-1/2 -mt-4">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 20">
                    <path d="M0,15 Q25,-5 50,10 T100,5" fill="none" stroke="#4f46e5" strokeWidth="1.5" strokeLinecap="round" className="drop-shadow-md" />
                  </svg>
                </div>
                
                {['Jan', 'Fev', 'Mar', 'Abr', 'Mai'].map((lbl) => (
                  <div key={lbl} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{lbl}</div>
                ))}
              </div>
            </div>

            <div className="soft-card p-6 flex flex-col relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-slate-800 font-semibold">Estatísticas de Veículos</h3>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors">
                    <FunnelIcon className="w-3 h-3" /> Filter
                  </button>
                </div>
              </div>
              
              <div className="flex-1 min-h-[160px] flex items-end justify-between px-2">
                {[40, 70, 45, 90, 60].map((h, i) => (
                  <div key={i} className="w-8 flex flex-col items-center gap-2 group/bar cursor-pointer">
                    <div className="w-full bg-slate-100 rounded-t-lg relative flex flex-col justify-end" style={{ height: '140px' }}>
                      <div 
                        className="w-full bg-indigo-500 rounded-t-lg transition-all duration-500 group-hover/bar:bg-indigo-400"
                        style={{ height: `${h}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                      {['Jan', 'Fev', 'Mar', 'Abr', 'Mai'][i]}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Glass tooltips simulation */}
              <div className="absolute top-1/3 left-1/3 glass-light rounded-xl p-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                <p className="text-[10px] font-bold text-slate-400 mb-2">Fevereiro 2026</p>
                <div className="flex items-center gap-4 mb-1">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-indigo-500"></div><span className="text-xs font-semibold text-slate-700">Entradas</span></div>
                  <span className="text-xs font-bold">120</span>
                </div>
              </div>
            </div>
            
          </div>

          {/* Bottom ROW - Tasks / Activities */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             {['Leads Novos', 'Veículos Prontos', 'Vistoria Agendada', 'Comercial/Contratos'].map((task) => (
                <div key={task} className="soft-card p-4 hover-float cursor-pointer border-transparent hover:border-slate-100">
                  <div className="flex justify-between items-start mb-6">
                    <h4 className="text-sm text-slate-800 font-semibold">{task}</h4>
                    <EllipsisHorizontalIcon className="w-5 h-5 text-slate-300" />
                  </div>
                  <p className="text-xs text-slate-500 mb-3 font-medium">Update Há 4 horas</p>
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-indigo-700 shadow-sm z-10">
                        {i}
                      </div>
                    ))}
                  </div>
                </div>
             ))}
          </div>
        </div>

        {/* Right Sidebar Area */}
        <div className="xl:col-span-1 space-y-6 flex flex-col">
          <div className="soft-card p-6 flex-1 hover-float border-transparent hover:border-slate-100">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-slate-800 font-semibold">Equipe de Operação</h3>
              <div className="text-xs font-semibold flex items-center gap-1 cursor-pointer text-slate-500 hover:text-indigo-600 transition-colors">
                Recentes <ChevronDownIcon className="w-3 h-3" />
              </div>
            </div>
            
            <div className="space-y-5">
              {teamMembers.map((member, i) => (
                <div key={member.name} className={`flex justify-between items-center group cursor-pointer ${i !== teamMembers.length - 1 ? 'border-b border-slate-50 pb-4' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 text-xs font-bold text-slate-500 flex items-center justify-center border-2 border-transparent group-hover:border-indigo-100 group-hover:text-indigo-600 transition-all">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm text-slate-800 font-semibold group-hover:text-indigo-600 transition-colors">{member.name}</p>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">{member.role} • {member.time}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              <button className="w-full text-center text-xs font-bold text-indigo-600 hover:text-indigo-800 pt-3 transition-colors">
                Ver Todos →
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
