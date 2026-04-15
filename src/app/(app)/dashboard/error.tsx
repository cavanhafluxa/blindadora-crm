'use client'
 
import { useEffect } from 'react'
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard Error:', error)
  }, [error])
 
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md w-full shadow-lg">
        <h2 className="text-2xl font-black text-red-700 mb-4 tracking-tight">Opa! Algo deu errado no Dashboard</h2>
        <p className="text-red-600 mb-6 font-medium">
          Identificamos uma falha ao carregar os dados. Isso pode ser causado por tabelas inexistentes no banco de dados.
        </p>
        
        <div className="bg-white rounded-lg p-4 mb-6 border border-red-100 text-left overflow-auto max-h-40">
          <p className="text-xs font-mono text-red-500 break-all">
            <strong>Erro Detalhado:</strong> {error.message || 'Erro desconhecido'}
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono text-slate-400 mt-2">
              Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-md"
          >
            Tentar Novamente
          </button>
          <a
            href="/dashboard"
            className="text-sm font-semibold text-slate-500 hover:text-slate-700"
          >
            Recarregar página inteira
          </a>
        </div>
      </div>
    </div>
  )
}
