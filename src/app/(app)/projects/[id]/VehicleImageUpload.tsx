'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Camera, Loader2, X, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface VehicleImageUploadProps {
  projectId: string
  initialImageUrl?: string | null
  vehicleModel?: string | null
}

export default function VehicleImageUpload({ projectId, initialImageUrl, vehicleModel }: VehicleImageUploadProps) {
  const supabase = createClient()
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState(initialImageUrl)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `vehicle_${projectId}_${Date.now()}.${fileExt}`
      const filePath = `vehicles/${fileName}`

      // Upload image to project_attachments bucket (reusing what we know exists)
      const { error: uploadError } = await supabase.storage
        .from('project_attachments')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('project_attachments')
        .getPublicUrl(filePath)

      // Update project table
      const { error: updateError } = await supabase
        .from('projects')
        .update({ vehicle_image: publicUrl })
        .eq('id', projectId)

      if (updateError) throw updateError

      setImageUrl(publicUrl)
      router.refresh()
    } catch (error: any) {
      console.error('Error uploading image:', error)
      alert('Erro ao carregar imagem: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {imageUrl ? (
        <div className="w-full h-full relative group/img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={imageUrl} 
            alt={vehicleModel || 'Veículo'} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105" 
          />
          
          {/* Discrete Edit/Change Button Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <label className="cursor-pointer bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all border border-white/30">
              <Upload className="w-3.5 h-3.5" />
              Alterar Foto
              <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        </div>
      ) : (
        <label className="cursor-pointer group/upload flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 transition-all duration-500 w-full h-full">
          {uploading ? (
            <Loader2 className="w-12 h-12 animate-spin text-indigo-500 opacity-40" />
          ) : (
            <>
              <div className="w-16 h-16 mb-3 rounded-2xl bg-slate-100 flex items-center justify-center group-hover/upload:bg-indigo-50 group-hover/upload:scale-110 transition-all duration-500">
                <Camera className="w-8 h-8 opacity-40 group-hover/upload:opacity-100" />
              </div>
              <span className="text-sm font-bold tracking-tight opacity-60 group-hover/upload:opacity-100">Adicionar Foto</span>
              <p className="text-[10px] uppercase tracking-widest font-black mt-1 opacity-40">Veículo em Produção</p>
            </>
          )}
          <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
        </label>
      )}

      {uploading && imageUrl && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      )}
    </div>
  )
}
