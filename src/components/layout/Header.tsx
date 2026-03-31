import { BellIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export function Header() {
  return (
    <header className="h-20 w-full px-6 lg:px-10 flex items-center justify-between z-10">
      <div className="flex-1 flex max-w-xl relative">
        <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="Busque por placa, lead, OS ou funcionário..."
          className="w-full bg-slate-900/50 border border-white/10 rounded-full py-2.5 pl-12 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
        />
      </div>

      <div className="flex items-center gap-4 ml-6">
        <button className="p-2.5 rounded-full bg-slate-900/50 border border-white/10 hover:bg-white/10 transition-colors relative">
          <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <BellIcon className="w-5 h-5 text-slate-300" />
        </button>
      </div>
    </header>
  );
}
