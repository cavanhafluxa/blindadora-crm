import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Car, ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CatalogPage() {
  const supabase = await createClient()

  // Buscamos apenas projetos marcados para publicar no catálogo
  const { data: vehicles } = await supabase
    .from('projects')
    .select('id, vehicle_model, vehicle_year, vehicle_color, catalog_price, catalog_description, contact_whatsapp, entry_photos')
    .eq('published_to_catalog', true)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-slate-900 border-b border-slate-800 text-white py-6">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-amber-500" />
            <div>
              <h1 className="text-2xl font-black tracking-tight">Seminovos Blindados</h1>
              <p className="text-sm text-slate-400 font-medium tracking-wide uppercase">Garantia & Procedência</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {!vehicles || vehicles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
             <Car className="w-16 h-16 text-slate-300 mx-auto mb-4" />
             <h2 className="text-xl font-bold text-slate-800">Nenhum veículo disponível no momento</h2>
             <p className="text-slate-500 mt-2">Em breve teremos novas opções no nosso portfólio.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vehicles.map(v => {
              const photos = v.entry_photos as string[] | undefined
              const hasPhoto = photos && photos.length > 0
              const mainPhoto = hasPhoto ? photos[0] : null
              const hasPrice = v.catalog_price !== null && v.catalog_price !== undefined

              return (
                <div key={v.id} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col">
                  {/* Image container */}
                  <div className="w-full h-64 bg-slate-100 relative overflow-hidden">
                    {mainPhoto ? (
                      <img src={mainPhoto} alt={v.vehicle_model || 'Veículo'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400 flex-col gap-2">
                         <Car className="w-10 h-10" />
                         <span className="text-sm font-medium">Sem imagem</span>
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      Blindado
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-2xl font-black text-slate-900 mb-1">{v.vehicle_model || 'Modelo não especificado'}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mb-4 font-medium">
                      <span>{v.vehicle_year || 'Ano N/I'}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span>{v.vehicle_color || 'Cor N/I'}</span>
                    </div>

                    <p className="text-slate-600 text-sm line-clamp-3 mb-6 flex-1">
                      {v.catalog_description || 'Veículo blindado com certificação Exército. Preencha o formulário ou chame no WhatsApp para mais informações.'}
                    </p>

                    <div className="mt-auto">
                      {hasPrice && (
                        <div className="mb-4">
                           <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Valor de Investimento</span>
                           <span className="text-2xl font-black text-slate-900">R$ {Number(v.catalog_price).toLocaleString('pt-BR')}</span>
                        </div>
                      )}

                      <Link href={`/catalogo/${v.id}`} className="w-full flex items-center justify-center font-bold px-6 py-3.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors">
                        Ver Detalhes
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 mt-12 text-center text-sm text-slate-500">
        <p>© 2026 Blindadora CRM. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
