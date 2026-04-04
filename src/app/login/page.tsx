import { login } from './actions'
import { ShieldCheckIcon } from 'lucide-react'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message: string, error: string }
}) {
  return (
    <div className="flex h-screen w-full">
      {/* Lado Esquerdo Verde */}
      <div className="hidden lg:flex w-1/2 bg-[#22C55E] flex-col justify-center items-center p-12 text-white">
        <ShieldCheckIcon className="w-24 h-24 mb-6 opacity-90" />
        <h1 className="text-4xl font-bold mb-4 tracking-tight text-center">Blindadoras PRO</h1>
        <p className="text-emerald-100 text-lg text-center max-w-md font-medium">
          O sistema definitivo para a gestão unificada e inteligente da sua operação de blindagem automotiva.
        </p>
      </div>

      {/* Lado Direito Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#F9FAFB]">
        <div className="max-w-md w-full px-8 py-10 soft-card">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-[#111827]">Bem-vindo de volta</h2>
            <p className="text-[#6B7280] text-sm mt-2">Acesse sua conta para continuar.</p>
          </div>

          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition-all"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-[#111827]" htmlFor="password">
                  Senha
                </label>
                <a href="#" className="text-sm font-semibold text-[#22C55E] hover:text-[#16A34A] transition-colors">
                  Esqueci minha senha
                </a>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                className="h-4 w-4 text-[#22C55E] focus:ring-[#22C55E] border-[#E5E7EB] rounded"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-[#6B7280]">
                Lembrar-me
              </label>
            </div>

            {searchParams?.error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">
                {searchParams.message || 'Falha ao autenticar.'}
              </div>
            )}

            <button
              formAction={login}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#22C55E] hover:bg-[#16A34A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#22C55E] transition-all"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
