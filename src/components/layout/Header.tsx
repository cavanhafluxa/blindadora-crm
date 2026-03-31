import { 
  BellIcon, 
  MagnifyingGlassIcon,
  GlobeAltIcon,
  ChevronDownIcon
} from "@heroicons/react/24/outline";
import Image from "next/image";

export function Header() {
  return (
    <header className="h-[80px] w-full px-8 flex items-center justify-between z-10 bg-[#f3f5f8]">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-8 h-8 rounded-md hover:bg-black/5 flex items-center justify-center cursor-pointer transition-colors">
          <svg className="w-5 h-5 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </div>
        
        <div className="relative flex-1 max-w-sm ml-2">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-0 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search here..."
            className="w-full bg-transparent border-none py-2 pl-7 pr-4 text-[13px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
          />
        </div>
      </div>

      <div className="flex items-center justify-end flex-1 gap-6">
        <div className="flex flex-col items-end mr-6">
          <p className="text-[14px] font-semibold text-slate-900 tracking-tight">
            Olá Wagner, Bem-vindo!
          </p>
          <p className="text-[10px] uppercase font-medium text-slate-400 tracking-widest mt-0.5">
            14 FEV 2026
          </p>
        </div>

        <div className="flex items-center gap-4 border-l border-slate-200 pl-6 border-r pr-6">
          <div className="flex items-center gap-1.5 cursor-pointer hover:text-indigo-600 transition-colors">
            <GlobeAltIcon className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-medium text-slate-700">PT</span>
            <ChevronDownIcon className="w-3 h-3 text-slate-400" />
          </div>

          <button className="relative p-2 hover:bg-black/5 rounded-full transition-colors cursor-pointer group">
            <div className="absolute top-1.5 right-2 w-2 h-2 rounded-full border-2 border-[#f3f5f8] bg-red-500 group-hover:border-slate-100 z-10 transition-colors"></div>
            <BellIcon className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="flex items-center gap-2 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center relative">
            <span className="text-xs font-bold text-indigo-700">WG</span>
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-[12px] font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">Wagner Santos</span>
          </div>
          <ChevronDownIcon className="w-3 h-3 text-slate-400 ml-1" />
        </div>
      </div>
    </header>
  );
}
