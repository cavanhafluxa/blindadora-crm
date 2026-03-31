"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Squares2X2Icon, 
  PresentationChartLineIcon, 
  ClipboardDocumentCheckIcon, 
  WrenchScrewdriverIcon, 
  CurrencyDollarIcon,
  BuildingLibraryIcon,
  ChartBarIcon,
  BellIcon,
  Cog6ToothIcon
} from "@heroicons/react/24/outline";

export function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/", icon: Squares2X2Icon },
  ];

  const adminTools = [
    { name: "CRM & Vendas", href: "/crm", icon: PresentationChartLineIcon },
    { name: "Produção", href: "/producao", icon: ClipboardDocumentCheckIcon },
    { name: "Financeiro", href: "/financeiro", icon: CurrencyDollarIcon },
    { name: "Seminovos", href: "/marketplace", icon: BuildingLibraryIcon },
  ];

  const insights = [
    { name: "Pós-Venda", href: "/pos-venda", icon: WrenchScrewdriverIcon },
    { name: "Notification", href: "/notificacoes", icon: BellIcon },
    { name: "Settings", href: "/configuracoes", icon: Cog6ToothIcon },
  ];

  const renderNavGroup = (title: string, items: typeof menuItems) => (
    <div className="mb-6">
      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-3 px-4">{title}</p>
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${
                isActive 
                  ? "bg-indigo-50 text-indigo-600" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <aside className="w-[280px] bg-white border-r border-slate-100 flex flex-col z-20 fixed top-0 bottom-0 left-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      {/* Header / Logo */}
      <div className="p-6 pb-2 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-medium text-lg shadow-lg shadow-indigo-600/20">
          PB
        </div>
        <div>
          <h1 className="text-base font-semibold text-slate-900 tracking-tight">
            PROBLIND
          </h1>
          <p className="text-[10px] uppercase font-medium text-slate-400 tracking-widest -mt-0.5">Core Panel</p>
        </div>
      </div>
      
      {/* Menu Area */}
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        {renderNavGroup("MENU", menuItems)}
        {renderNavGroup("ADMIN TOOLS", adminTools)}
        {renderNavGroup("INSIGHTS", insights)}
      </div>

      {/* Upgrade Call to action */}
      <div className="p-6">
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full filter blur-xl -mr-10 -mt-10" />
          <h4 className="text-xs font-medium text-slate-900 mb-2 leading-relaxed">
            LET'S UPGRADE TO <br /> PRO ACCOUNT
          </h4>
          <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
            Libere todas as automações e funis de CRM.
          </p>
          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 py-2.5 rounded-xl text-xs font-bold transition-all">
            ⭐ Upgrade Now
          </button>
        </div>
      </div>
    </aside>
  );
}
