import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ShieldCheck, ArrowLeft, MessageCircle, Calendar, Droplet, Cog, Check } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CatalogVehiclePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Buscamos o projeto e seus estágios com fotos (usando a relação correta: projects -> production_stages -> stage_photos)
  const { data: vehicle, error } = await supabase
    .from('projects')
    .select(`
      *,
      production_stages (
        id,
        stage_name,
        stage_photos (
          photo_url
        )
      )
    `)
    .eq('id', params.id)
    .eq('published_to_catalog', true)
    .single()

  if (!vehicle) {
    notFound()
  }

  const photos = vehicle.entry_photos as string[] | undefined
  const hasPhoto = photos && photos.length > 0
  const mainPhoto = hasPhoto ? photos[0] : null
  const hasPrice = vehicle.catalog_price !== null && vehicle.catalog_price !== undefined

  const phoneDigits = vehicle.contact_whatsapp?.replace(/\\D/g, '') || ''
  const wppMsg = encodeURIComponent(`Olá! Tenho interesse no ${vehicle.vehicle_model} blindado que está no catálogo do site.`)
  const wppUrl = phoneDigits ? `https://wa.me/55${phoneDigits}?text=${wppMsg}` : null

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-slate-900 border-b border-slate-800 text-white py-6">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-amber-500" />
              <div>
                <h1 className="text-xl font-black tracking-tight">Seminovos Blindados</h1>
              </div>
            </div>
            <Link href="/catalogo" className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2">
               <ArrowLeft className="w-4 h-4" /> Voltar ao catálogo
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
           {/* Imagens */}
           <div className="lg:col-span-3 space-y-6">
             {mainPhoto ? (
               <div className="w-full aspect-[4/3] bg-slate-200 rounded-3xl overflow-hidden shadow-md">
                 <img src={mainPhoto} alt={vehicle.vehicle_model || 'Veículo'} className="w-full h-full object-cover" />
               </div>
             ) : (
               <div className="w-full aspect-[4/3] bg-slate-200 rounded-3xl flex items-center justify-center text-slate-400 shadow-md">
                  <span className="font-medium">Imagem não disponível</span>
               </div>
             )}

             {hasPhoto && photos.length > 1 && (
               <div className="grid grid-cols-4 gap-4">
                 {photos.slice(1).map((p, i) => (
                   <div key={i} className="aspect-square bg-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <img src={p} alt="" className="w-full h-full object-cover" />
                   </div>
                 ))}
               </div>
             )}
             
             {/* Fotos de Produção (Prova de Trabalho) */}
             {vehicle.production_stages && vehicle.production_stages.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Cog className="w-5 h-5 text-amber-500" /> Transparência: Fotos da Blindagem
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {vehicle.production_stages.map((stage: any) => 
                      stage.stage_photos?.map((sp: any, i: number) => (
                        <div key={`${stage.id}-${i}`} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200">
                          <img src={sp.photo_url} alt={stage.stage_name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 flex flex-col justify-end">
                             <span className="text-white text-[13px] font-bold leading-tight uppercase tracking-wider">{stage.stage_name}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
             )}
           </div>

           {/* Detalhes */}
           <div className="lg:col-span-2">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-lg sticky top-8">
                <div className="inline-block bg-amber-100 text-amber-800 text-[13px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
                  Blindado Certificado Exército
                </div>
                
                <h2 className="text-4xl font-black text-slate-900 mb-6 leading-tight">{vehicle.vehicle_model || 'Modelo Oculto'}</h2>
                
                {hasPrice && (
                  <div className="mb-8">
                     <span className="text-[13px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Valor de Investimento</span>
                     <span className="text-4xl font-black text-slate-900">R$ {Number(vehicle.catalog_price).toLocaleString('pt-BR')}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
                  <div className="bg-slate-50 p-4 rounded-2xl flex flex-col gap-1 border border-slate-100">
                     <Calendar className="w-5 h-5 text-slate-400 mb-1" />
                     <span className="text-slate-500 uppercase text-[13px] font-bold tracking-wider">Ano</span>
                     <span className="font-bold text-slate-800">{vehicle.vehicle_year || 'N/I'}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl flex flex-col gap-1 border border-slate-100">
                     <Droplet className="w-5 h-5 text-slate-400 mb-1" />
                     <span className="text-slate-500 uppercase text-[13px] font-bold tracking-wider">Cor Externa</span>
                     <span className="font-bold text-slate-800">{vehicle.vehicle_color || 'N/I'}</span>
                  </div>
                </div>

                <div className="mb-8">
                  <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Sobre o Veículo</h4>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {vehicle.catalog_description || 'Veículo blindado disponível para venda. Preencha o formulário ou chame no WhatsApp para mais informações, propostas e negociação.'}
                  </p>
                </div>

                <div className="mb-8 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                     <Check className="w-4 h-4 text-green-500" /> Garantia de Blindagem Ativa
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                     <Check className="w-4 h-4 text-green-500" /> Documentação Regularizada (SICOVAB)
                  </div>
                </div>

                {wppUrl ? (
                  <a href={wppUrl} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 font-bold px-6 py-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors shadow-lg shadow-green-500/30">
                    <MessageCircle className="w-5 h-5" /> Tenho Interesse (WhatsApp)
                  </a>
                ) : (
                  <button disabled className="w-full text-center font-bold px-6 py-4 bg-slate-100 text-slate-400 rounded-xl cursor-not-allowed">
                    WhatsApp Indisponível
                  </button>
                )}
              </div>
           </div>
        </div>
      </main>
    </div>
  )
}
