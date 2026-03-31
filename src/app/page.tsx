import { 
  ArrowTrendingUpIcon, 
  PresentationChartLineIcon, 
  ShieldCheckIcon, 
  WrenchScrewdriverIcon 
} from "@heroicons/react/24/outline";

export default function Home() {
  const stats = [
    { name: "Vendas Mês (Leads Convertidos)", value: "24", change: "+12%", icon: PresentationChartLineIcon },
    { name: "Veículos em Produção", value: "8", change: "+2", icon: ShieldCheckIcon },
    { name: "Ordens de Serviço Abertas", value: "15", change: "-3", icon: WrenchScrewdriverIcon },
    { name: "Faturamento Estimado", value: "R$ 480k", change: "+8%", icon: ArrowTrendingUpIcon },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Visão Geral</h2>
        <p className="text-slate-400">Aqui está o resumo operacional da blindadora hoje.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="glass-card p-6 flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <stat.icon className="w-20 h-20 text-blue-500" />
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <stat.icon className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div className="relative z-10 mt-4">
              <p className="text-sm font-medium text-slate-400 mb-1">{stat.name}</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <div className={`text-sm font-medium flex items-center gap-1 ${stat.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stat.change}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
        {/* Etapas de Produção - Resumo */}
        <div className="glass-panel p-6 lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <ShieldCheckIcon className="w-5 h-5 text-blue-400" />
            Funil de Produção Atual
          </h3>
          <div className="space-y-4">
            {['Desmontagem', 'Aramida e Aço', 'Vidros e Pintura', 'Remontagem', 'Qualidade Final'].map((etapa, idx) => (
              <div key={etapa} className="flex items-center gap-4">
                <div className="w-32 text-sm text-slate-400 font-medium">{etapa}</div>
                <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" 
                    style={{ width: `${Math.max(10, 100 - (idx * 20))}%` }} 
                  />
                </div>
                <div className="w-8 text-right text-sm font-bold text-white">
                  {Math.floor(Math.random() * 5 + 1)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notificações / Alertas */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-bold text-white mb-6">Próximas Revisões</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4 p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500" />
                <div>
                  <p className="text-sm font-bold text-slate-200">Toyota Hilux SRX</p>
                  <p className="text-xs text-slate-500 mt-1">Revisão de 1 ano • Amanhã</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
