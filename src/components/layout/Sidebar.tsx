import Link from "next/link";
import { 
  BuildingLibraryIcon, 
  ChartPieIcon, 
  ClipboardDocumentCheckIcon, 
  CurrencyDollarIcon, 
  PresentationChartLineIcon, 
  WrenchScrewdriverIcon 
} from "@heroicons/react/24/outline";

export function Sidebar() {
  const menuItems = [
    { name: "Dashboard", href: "/", icon: ChartPieIcon },
    { name: "CRM & Vendas", href: "/crm", icon: PresentationChartLineIcon },
    { name: "Produção", href: "/producao", icon: ClipboardDocumentCheckIcon },
    { name: "Assistência & Pós-Venda", href: "/pos-venda", icon: WrenchScrewdriverIcon },
    { name: "Financeiro", href: "/financeiro", icon: CurrencyDollarIcon },
    { name: "Portal Seminovos", href: "/marketplace", icon: BuildingLibraryIcon },
  ];

  return (
    <aside className="w-64 glass-panel m-4 flex flex-col z-10 sticky top-4 h-[calc(100vh-2rem)]">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          PROBlind
        </h1>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">CRM Blindadoras</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-slate-300 hover:text-white hover:bg-white/10 group"
            >
              <Icon className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
            W
          </div>
          <div>
            <p className="text-sm font-medium">Wagner</p>
            <p className="text-xs text-slate-400">Administrador</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
