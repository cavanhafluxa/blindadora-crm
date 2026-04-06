import { login } from './actions'
import { ArrowRight, ShieldCheck } from 'lucide-react'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const resolvedParams = await searchParams

  return (
    <div className="relative min-h-screen flex items-center justify-center sm:justify-end sm:pr-24 overflow-hidden bg-black">
      {/* Background Image Loading from Public */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out"
        style={{ backgroundImage: 'url("/bg-login.png")' }}
      ></div>
      
      {/* Dark overlay & vignette for better glassmorphism contrast */}
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/20 via-black/40 to-black/90"></div>
      <div className="absolute inset-0 z-0 bg-black/30 backdrop-blur-[2px]"></div>

      {/* Decorative branding elements (Optional UI elements feeling like the aura design) */}
      <div className="absolute top-8 left-8 z-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-mono text-sm tracking-widest uppercase opacity-80 shadow-black drop-shadow-md">ACESSO // PROBlind</span>
      </div>

      <div className="absolute top-8 right-8 z-10">
        <span className="text-white/50 font-mono text-xs tracking-widest uppercase">V1.0 // TEMA ESCURO</span>
      </div>

      {/* The Glassmorphism Form Container */}
      <div className="relative z-10 w-full max-w-sm px-6 py-10 bg-[#0A0A0A]/60 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-2xl flex flex-col items-center">
        
        <div className="w-full mb-8">
          <span className="inline-block px-2 py-1 bg-white/10 rounded text-[10px] uppercase tracking-[0.2em] font-bold text-white/70 mb-4">
            PROBlind CRM
          </span>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Bem-vindo de volta
          </h1>
          <p className="text-white/50 text-sm font-medium">
            Entre com suas credenciais para continuar.
          </p>
        </div>

        {/* Divider */}
        <div className="w-full flex items-center gap-4 mb-8 opacity-40">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/50"></div>
          <span className="text-[10px] font-bold tracking-[0.2em] text-white uppercase">Acesso Seguro</span>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/50"></div>
        </div>

        {/* Form elements */}
        <form className="w-full space-y-6">
          <div>
            <label className="block text-[10px] font-bold tracking-widest text-white/50 uppercase mb-2 ml-1" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-5 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/50 focus:border-white/50 transition-all font-mono"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-widest text-white/50 uppercase mb-2 ml-1" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-5 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/50 focus:border-white/50 transition-all tracking-widest"
              placeholder="••••••••"
            />
          </div>

          {resolvedParams?.error && (
            <div className="p-3 bg-red-500/20 text-red-300 rounded-xl text-xs font-semibold tracking-wide border border-red-500/30 text-center">
              {resolvedParams.error}
            </div>
          )}

          <button
            formAction={login}
            className="w-full mt-4 flex items-center justify-center gap-3 bg-white text-black font-bold text-sm tracking-widest uppercase py-4 rounded-full hover:bg-slate-200 transition-all glow-effect group"
          >
            Entrar no sistema
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

      </div>
      
      {/* Decorative text at bottom */}
      <div className="absolute bottom-8 left-8 z-10">
        <span className="text-white/30 font-mono text-xs tracking-widest uppercase">CONEXÃO_SEGURA_</span>
      </div>
    </div>
  )
}
