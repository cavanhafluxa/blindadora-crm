import { login } from './actions'
import { ShieldCheck } from 'lucide-react'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Marca */}
      <div
        className="hidden lg:flex w-1/2 flex-col justify-center items-center p-12"
        style={{ background: 'linear-gradient(135deg, #111827 0%, #1a2740 100%)' }}
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-green-500 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <span className="text-white text-3xl font-bold tracking-tight">PROBlind</span>
        </div>
        <h1 className="text-white text-4xl font-bold text-center leading-tight mb-4">
          CRM para<br />Blindagem Automotiva
        </h1>
        <p className="text-slate-400 text-center text-lg max-w-sm">
          Gerencie leads, projetos, estoque, financeiro e pós-venda em um único lugar.
        </p>

        <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-sm">
          {[
            { label: 'Pipeline de Vendas', desc: 'Kanban integrado' },
            { label: '12 Etapas', desc: 'Rastreio de produção' },
            { label: 'Estoque', desc: 'Controle de materiais' },
            { label: 'Financeiro', desc: 'DRE e relatórios' },
          ].map((item) => (
            <div key={item.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-white text-sm font-semibold">{item.label}</p>
              <p className="text-slate-400 text-xs mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="flex-1 flex items-center justify-center bg-[#F9FAFB] p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-slate-800 text-xl font-bold">PROBlind CRM</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-1">Bem-vindo de volta</h2>
          <p className="text-slate-500 text-sm mb-8">Entre com suas credenciais para continuar.</p>

          <div className="soft-card p-8">
            <form className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="email">
                  E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="password">
                  Senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>

              {searchParams?.error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">
                  {searchParams.error}
                </div>
              )}

              <button
                formAction={login}
                className="btn-primary w-full justify-center py-3 text-base mt-2"
              >
                Entrar no sistema
              </button>
            </form>
          </div>

          <p className="text-center text-slate-400 text-xs mt-6">
            © 2025 PROBlind CRM. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}
