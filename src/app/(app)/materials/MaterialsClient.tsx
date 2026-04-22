'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Package, Plus, Trash2, Edit2, AlertTriangle, ArrowUp, ArrowDown, History, Upload, Loader2, Download, DollarSign, Paperclip, CheckCircle, X } from 'lucide-react'

type Material = {
  id: string
  name: string
  sku: string | null
  quantity_in_stock: number
  unit_price: number | null
  minimum_stock: number
  reserved_quantity: number
}

type Movement = {
  id: string
  material_id: string
  movement_type: 'in' | 'out'
  quantity: number
  supplier?: { name: string } | null
  project?: { customer_name: string; vehicle_model: string } | null
  invoice_url: string | null
  created_at: string
  materials: { name: string, sku: string | null }
}

export default function MaterialsClient({ 
  initialMaterials,
  suppliers,
  projects
}: { 
  initialMaterials: Material[],
  suppliers: any[],
  projects: any[]
}) {
  const supabase = createClient()
  const [materials, setMaterials] = useState<Material[]>(initialMaterials)
  const [movements, setMovements] = useState<Movement[]>([])
  const [activeTab, setActiveTab] = useState<'materials' | 'history' | 'suggestions'>('materials')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [stockModal, setStockModal] = useState<{ id: string; name: string; op: 'add' | 'remove' } | null>(null)
  const [stockQty, setStockQty] = useState('1')
  const [stockSupplier, setStockSupplier] = useState('')
  const [stockProject, setStockProject] = useState('')
  const [stockFile, setStockFile] = useState<File | null>(null)
  const [materialFile, setMaterialFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const materialFileInputRef = useRef<HTMLInputElement>(null)
  const [isProcessingStock, setIsProcessingStock] = useState(false)

  const [form, setForm] = useState({ name: '', sku: '', unit_price: '', minimum_stock: '5', quantity_in_stock: '0', reserved_quantity: '0' })
  const [saving, setSaving] = useState(false)

  const [reserveModal, setReserveModal] = useState<{ id: string; name: string } | null>(null)
  const [reserveQty, setReserveQty] = useState('0')

  async function loadHistory() {
    const { data } = await supabase
      .from('stock_movements')
      .select(`
        id, material_id, movement_type, quantity, invoice_url, created_at,
        supplier:suppliers(name),
        project:projects(customer_name, vehicle_model),
        materials(name, sku)
      `)
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (data) setMovements(data as any[])
  }

  // Load history when tab changes
  useEffect(() => {
    if (activeTab === 'history' && movements.length === 0) {
      loadHistory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  async function getOrgId() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    return data?.organization_id ?? null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    if (editingId) {
      const { data } = await supabase.from('materials').update({
        name: form.name,
        sku: form.sku || null,
        unit_price: form.unit_price ? Number(form.unit_price) : null,
        minimum_stock: Number(form.minimum_stock),
        reserved_quantity: Number(form.reserved_quantity),
      }).eq('id', editingId).select().single()
      if (data) setMaterials(prev => prev.map(m => m.id === editingId ? data as Material : m))
      setEditingId(null)
    } else {
      const orgId = await getOrgId()
      let invoiceUrl = null

      // Upload invoice if provided
      if (materialFile) {
        const fileExt = materialFile.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const path = `stock/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(path, materialFile)
        
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(path)
          invoiceUrl = publicUrl
        }
      }

      const { data, error } = await supabase.from('materials').insert({
        name: form.name,
        sku: form.sku || null,
        unit_price: form.unit_price ? Number(form.unit_price) : null,
        minimum_stock: Number(form.minimum_stock),
        quantity_in_stock: Number(form.quantity_in_stock),
        reserved_quantity: Number(form.reserved_quantity),
        organization_id: orgId,
      }).select().single()

      if (data) {
        setMaterials(prev => [data as Material, ...prev])
        
        // If initial stock provided, create a movement record
        const initialQty = Number(form.quantity_in_stock)
        if (initialQty > 0) {
          await supabase.from('stock_movements').insert({
            organization_id: orgId,
            material_id: data.id,
            movement_type: 'in',
            quantity: initialQty,
            invoice_url: invoiceUrl,
            notes: 'Estoque Inicial'
          })
          if (activeTab === 'history') loadHistory()
        }
      }
    }
    setSaving(false)
    setShowForm(false)
    setMaterialFile(null)
    setForm({ name: '', sku: '', unit_price: '', minimum_stock: '5', quantity_in_stock: '0', reserved_quantity: '0' })
  }

  function startEdit(m: Material) {
    setForm({ 
      name: m.name, 
      sku: m.sku || '', 
      unit_price: m.unit_price?.toString() || '', 
      minimum_stock: m.minimum_stock.toString(), 
      quantity_in_stock: m.quantity_in_stock.toString(),
      reserved_quantity: m.reserved_quantity.toString() 
    })
    setEditingId(m.id)
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir material?')) return
    await supabase.from('materials').delete().eq('id', id)
    setMaterials(prev => prev.filter(m => m.id !== id))
  }

  async function handleReserveUpdate() {
    if (!reserveModal) return
    setIsProcessingStock(true)
    const qty = parseInt(reserveQty) || 0
    
    await supabase.from('materials').update({ reserved_quantity: qty }).eq('id', reserveModal.id)
    setMaterials(prev => prev.map(m => m.id === reserveModal.id ? { ...m, reserved_quantity: qty } : m))
    
    setIsProcessingStock(false)
    setReserveModal(null)
  }

  async function handleStockUpdate() {
    if (!stockModal) return
    setIsProcessingStock(true)

    const qty = parseInt(stockQty)
    if (isNaN(qty) || qty <= 0) {
      alert('Quantidade inválida')
      setIsProcessingStock(false)
      return
    }

    try {
      const orgId = await getOrgId()
      let invoiceUrl = null

      // Handle file upload for stock entries
      if (stockFile && stockModal.op === 'add') {
        const fileExt = stockFile.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const path = `stock/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(path, stockFile)
        
        if (uploadError) {
          console.error('Upload error:', uploadError)
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(path)
          invoiceUrl = publicUrl
        }
      }

      const currentMaterial = materials.find(m => m.id === stockModal.id)
      if (!currentMaterial) throw new Error('Material não encontrado')

      const newQty = stockModal.op === 'add' 
        ? currentMaterial.quantity_in_stock + qty 
        : currentMaterial.quantity_in_stock - qty

      if (newQty < 0) {
        alert('Estoque insuficiente para esta saída.')
        setIsProcessingStock(false)
        return
      }

      // 1. Update material quantity
      const { error: updateError } = await supabase
        .from('materials')
        .update({ quantity_in_stock: newQty })
        .eq('id', stockModal.id)

      if (updateError) throw updateError

      // 2. Register movement
      const { error: moveError } = await supabase.from('stock_movements').insert({
        organization_id: orgId,
        material_id: stockModal.id,
        movement_type: stockModal.op === 'add' ? 'in' : 'out',
        quantity: qty,
        supplier_id: stockSupplier || null,
        project_id: stockProject || null,
        invoice_url: invoiceUrl,
        unit_cost: stockModal.op === 'add' ? Number(currentMaterial.unit_price || 0) : null
      })

      if (moveError) throw moveError

      // 3. Update local state
      setMaterials(prev => prev.map(m => m.id === stockModal.id ? { ...m, quantity_in_stock: newQty } : m))
      
      // Cleanup
      setStockModal(null)
      setStockQty('1')
      setStockSupplier('')
      setStockProject('')
      setStockFile(null)
      
      if (activeTab === 'history') loadHistory()
      
    } catch (err: any) {
      alert('Erro ao atualizar estoque: ' + (err.message || err))
    } finally {
      setIsProcessingStock(false)
    }
  }

  const lowStock = materials.filter(m => m.quantity_in_stock <= m.minimum_stock)
  const inventoryValue = materials.reduce((acc, m) => acc + (m.quantity_in_stock * (m.unit_price || 0)), 0)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Estoque de Materiais</h1>
          <p className="text-slate-500 text-base mt-2">{materials.length} itens cadastrados</p>
        </div>
        {activeTab === 'materials' && (
          <div className="flex gap-2">
            <div className="soft-card px-5 py-3 bg-slate-50 flex items-center gap-4">
              <div className="p-2.5 bg-indigo-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-[13px] text-slate-500 font-bold uppercase tracking-wider">Valor do Inventário</p>
                <p className="text-base font-bold text-slate-800">R$ {inventoryValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', sku: '', unit_price: '', minimum_stock: '5', quantity_in_stock: '0', reserved_quantity: '0' }) }}>
              <Plus className="w-4 h-4" /> Novo Material
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-4 border-b border-slate-200 mb-8">
        <button
          onClick={() => setActiveTab('materials')}
          className={`pb-4 px-5 font-semibold text-base transition-colors border-b-2 ${activeTab === 'materials' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          Materiais
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-4 px-5 font-semibold text-base transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'history' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          <History className="w-5 h-5" /> Histórico (Extrato)
        </button>
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`pb-4 px-5 font-semibold text-base transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'suggestions' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          <Package className="w-5 h-5" /> Sugestão de Compra
        </button>
      </div>

      {activeTab === 'materials' && (
        <div className="animate-in fade-in">
          {/* Low stock alert */}
          {lowStock.length > 0 && (
            <div className="flex items-center gap-4 p-5 bg-amber-50 border border-amber-200 rounded-xl mb-8">
              <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
              <p className="text-base text-amber-700">
                <strong>{lowStock.length} item{lowStock.length > 1 ? 's' : ''}</strong> com estoque baixo: {lowStock.map(m => m.name).join(', ')}
              </p>
            </div>
          )}

          {/* Form */}
          {showForm && (
            <div className="soft-card p-7 mb-8 bg-white shrink">
              <h3 className="font-bold text-xl text-slate-800 mb-6">{editingId ? 'Editar Material' : 'Novo Material'}</h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  { name: 'name', label: 'Nome do Material *', type: 'text', required: true, placeholder: 'Manta Aramida' },
                  { name: 'sku', label: 'SKU / Código', type: 'text', required: false, placeholder: 'MAT-001' },
                  { name: 'unit_price', label: 'Preço Unitário (R$)', type: 'text', required: false, placeholder: '250,00' },
                  { name: 'minimum_stock', label: 'Estoque Mínimo', type: 'number', required: false, placeholder: '5' },
                  ...(!editingId ? [{ name: 'quantity_in_stock', label: 'Qtd. Inicial em Estoque', type: 'number', required: false, placeholder: '0' }] : []),
                ].map(f => (
                  <div key={f.name}>
                    <label className="text-[13px] font-semibold text-slate-600 block mb-1.5">{f.label}</label>
                    <input required={f.required} type={f.type} placeholder={f.placeholder} value={form[f.name as keyof typeof form]}
                      onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                  </div>
                ))}
                {!editingId && (
                  <div className="flex flex-col justify-end">
                    <label className="text-[13px] font-semibold text-slate-600 block mb-1.5">Nota Fiscal (Opcional)</label>
                    <input type="file" ref={materialFileInputRef} className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setMaterialFile(e.target.files?.[0] || null)} />
                    <button 
                      type="button"
                      onClick={() => materialFileInputRef.current?.click()}
                      className={`flex items-center gap-2 px-4 h-[38px] rounded-xl border cursor-pointer transition-all ${materialFile ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}
                    >
                      <Upload className={`w-4 h-4 ${materialFile ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className="text-[13px] font-bold truncate max-w-[150px]">
                        {materialFile ? materialFile.name : 'Anexar Nota'}
                      </span>
                      {materialFile && (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setMaterialFile(null);
                          }}
                          className="ml-auto p-1 hover:bg-indigo-100 rounded-md transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                      )}
                    </button>
                  </div>
                )}
                <div className="flex gap-4 items-end col-span-2 md:col-span-1">
                  <button type="submit" disabled={saving} className="btn-primary py-2.5 px-6 min-w-[120px] flex items-center justify-center gap-2">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Adicionar'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-sm text-slate-500 font-medium">Cancelar</button>
                </div>
              </form>
            </div>
          )}

          {/* Table */}
          <div className="soft-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 py-4 text-[13px] font-semibold text-slate-500 uppercase">Material</th>
                    <th className="text-left px-6 py-4 text-[13px] font-semibold text-slate-500 uppercase">SKU</th>
                    <th className="text-center px-6 py-4 text-[13px] font-semibold text-slate-500 uppercase">Estoque Real</th>
                    <th className="text-center px-6 py-4 text-[13px] font-semibold text-slate-500 uppercase">Reservado</th>
                    <th className="text-center px-6 py-4 text-[13px] font-semibold text-slate-500 uppercase">Disponível</th>
                    <th className="text-center px-6 py-4 text-[13px] font-semibold text-slate-500 uppercase">Mín.</th>
                    <th className="text-right px-6 py-4 text-[13px] font-semibold text-slate-500 uppercase">Preço Unit.</th>
                    <th className="text-center px-6 py-4 text-[13px] font-semibold text-slate-500 uppercase">Ações</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materials.map(m => {
                    const isLow = m.quantity_in_stock <= m.minimum_stock
                    return (
                      <tr key={m.id} className={`hover:bg-slate-50 transition-colors ${isLow ? 'bg-amber-50/30' : ''}`}>
                        <td className="px-6 py-2.5">
                          <div className="flex items-center gap-3">
                            <Package className="w-5 h-5 text-slate-400" />
                            <span className="font-medium text-slate-700">{m.name}</span>
                            {isLow && <span className="text-[13px] bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full font-medium">Baixo</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4.5 text-sm text-slate-500">{m.sku || '—'}</td>
                        <td className="px-6 py-4.5 text-center">
                          <span className={`font-bold text-sm ${isLow ? 'text-amber-600' : 'text-slate-700'}`}>{m.quantity_in_stock}</span>
                        </td>
                        <td className="px-6 py-4.5 text-center">
                          <button onClick={() => { setReserveModal({ id: m.id, name: m.name }); setReserveQty(m.reserved_quantity.toString()) }} 
                            className="text-[13px] font-medium bg-slate-100 px-2.5 py-1 rounded hover:bg-slate-200 transition-colors">
                            {m.reserved_quantity}
                          </button>
                        </td>
                        <td className="px-6 py-4.5 text-center">
                          <span className={`font-bold text-sm ${m.quantity_in_stock - m.reserved_quantity < m.minimum_stock ? 'text-red-500' : 'text-slate-700'}`}>
                            {m.quantity_in_stock - m.reserved_quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-center text-sm text-slate-500">{m.minimum_stock}</td>
                        <td className="px-6 py-4.5 text-right text-sm text-slate-600">
                          {m.unit_price ? `R$ ${Number(m.unit_price).toLocaleString('pt-BR')}` : '—'}
                        </td>
                        <td className="px-6 py-4.5">
                          <div className="flex items-center justify-center gap-3">
                            <button onClick={() => setStockModal({ id: m.id, name: m.name, op: 'add' })} title="Entrada"
                              className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button onClick={() => setStockModal({ id: m.id, name: m.name, op: 'remove' })} title="Saída"
                              className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                              <ArrowDown className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => startEdit(m)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(m.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {materials.length === 0 && <p className="text-center text-slate-400 py-12 text-sm">Nenhum material cadastrado.</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="animate-in fade-in">
          <div className="soft-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 py-4 text-[13px] font-semibold text-slate-500 uppercase">Data</th>
                    <th className="text-left px-6 py-4 text-[13px] font-semibold text-slate-500 uppercase">Material</th>
                    <th className="text-center px-6 py-4 text-[13px] font-semibold text-slate-500 uppercase">Qtd</th>
                    <th className="text-left px-6 py-4 text-[13px] font-semibold text-slate-500 uppercase">Origem / Destino</th>
                    <th className="text-center px-6 py-4 text-[13px] font-semibold text-slate-500 uppercase">Comprovante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 text-sm text-slate-500">
                        {new Date(m.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-6 py-3">
                         <div className="font-medium text-slate-700">{m.materials?.name}</div>
                         <div className="text-[13px] text-slate-400">{m.materials?.sku || 'S/ SKU'}</div>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-full text-[13px] ${m.movement_type === 'in' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {m.movement_type === 'in' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                          {m.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        {m.movement_type === 'in' && m.supplier && (
                          <div className="text-[13px] text-slate-600"><span className="font-semibold">Fornecedor:</span> {m.supplier.name}</div>
                        )}
                        {m.movement_type === 'in' && !m.supplier && <span className="text-[13px] text-slate-400">Entrada Avulsa</span>}
                        
                        {m.movement_type === 'out' && m.project && (
                          <div className="text-[13px] text-slate-600"><span className="font-semibold">Projeto:</span> {m.project.customer_name} ({m.project.vehicle_model})</div>
                        )}
                        {m.movement_type === 'out' && !m.project && <span className="text-[13px] text-slate-400">Saída Avulsa</span>}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {m.invoice_url ? (
                          <a 
                            href={`https://ncfozqgrdfkbaexixzta.supabase.co/storage/v1/object/public/documents/${m.invoice_url}`} 
                            target="_blank" rel="noreferrer"
                            className="inline-flex p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                            title="Ver Nota / Anexo"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {movements.length === 0 && <p className="text-center text-slate-400 py-12 text-sm">Nenhum histórico de movimentação.</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'suggestions' && (
        <div className="animate-in fade-in space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="soft-card p-8 bg-amber-50 border-amber-200">
              <h3 className="text-amber-800 font-bold flex items-center gap-3 mb-3 text-base">
                <AlertTriangle className="w-5 h-5" /> Reposição Necessária
              </h3>
              <p className="text-3xl font-bold text-amber-900">
                {materials.filter(m => (m.quantity_in_stock - m.reserved_quantity) < m.minimum_stock).length}
              </p>
              <p className="text-sm text-amber-700 mt-1">Materiais abaixo do estoque mínimo</p>
            </div>
          </div>

          <div className="soft-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-6 py-4 text-[13px] font-semibold text-slate-500 uppercase">Material</th>
                  <th className="text-center px-6 py-4 text-[13px] font-semibold text-slate-500 uppercase">Estoque Disponível</th>
                  <th className="text-center px-6 py-4 text-[13px] font-semibold text-slate-500 uppercase">Mínimo</th>
                  <th className="text-center px-6 py-4 text-[13px] font-semibold text-slate-500 uppercase">Déficit</th>
                  <th className="text-center px-6 py-4 text-[13px] font-semibold text-slate-500 uppercase">Sugestão de Compra</th>
                  <th className="text-right px-6 py-4 text-[13px] font-semibold text-slate-500 uppercase">Custo Est. (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materials
                  .filter(m => (m.quantity_in_stock - m.reserved_quantity) < m.minimum_stock)
                  .map(m => {
                    const available = m.quantity_in_stock - m.reserved_quantity
                    const deficit = m.minimum_stock - available
                    const suggestion = deficit + Math.ceil(m.minimum_stock * 0.5) // Deficit + 50% extra for safety
                    const cost = suggestion * (m.unit_price || 0)

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3.5">
                          <p className="font-semibold text-slate-800">{m.name}</p>
                          <p className="text-[13px] text-slate-400 font-mono">{m.sku || 'S/ SKU'}</p>
                        </td>
                        <td className="px-6 py-5 text-center font-medium text-slate-700">
                          {available} 
                          <span className="text-[13px] text-slate-400 ml-1">(Real: {m.quantity_in_stock})</span>
                        </td>
                        <td className="px-6 py-5 text-center text-sm text-slate-600">{m.minimum_stock}</td>
                        <td className="px-6 py-5 text-center font-bold text-red-500">-{deficit}</td>
                        <td className="px-6 py-5 text-center">
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[13px] font-bold">
                             {suggestion} un
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right font-semibold text-slate-800">
                          R$ {cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )
                  })}
                {materials.filter(m => (m.quantity_in_stock - m.reserved_quantity) < m.minimum_stock).length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      ✅ Todos os materiais estão com estoque saudável.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock movement modal */}
      {stockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-slate-800 mb-1">{stockModal.op === 'add' ? '📦 Entrada de Estoque' : '📤 Saída para Projeto'}</h3>
            <p className="text-sm text-slate-500 mb-4">{stockModal.name}</p>
            
            <label className="text-[13px] font-semibold text-slate-500 block mb-1">Quantidade</label>
            <input type="number" min="1" value={stockQty} onChange={e => setStockQty(e.target.value)}
              className="w-full px-4 py-3 text-base font-bold text-center border border-slate-200 rounded-xl mb-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            
            {stockModal.op === 'add' && (
              <div className="space-y-4 mb-4">
                <div>
                  <label className="text-[13px] font-semibold text-slate-500 block mb-1">Fornecedor (Opcional)</label>
                  <select
                    value={stockSupplier}
                    onChange={e => setStockSupplier(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Selecione um fornecedor...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-slate-500 block mb-1">Nota Fiscal / Comprovante</label>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setStockFile(e.target.files?.[0] || null)} />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full flex items-center gap-2 px-4 h-[38px] rounded-xl border cursor-pointer transition-all ${stockFile ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}
                  >
                    <Upload className={`w-4 h-4 ${stockFile ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="text-[13px] font-bold truncate max-w-[150px]">
                      {stockFile ? stockFile.name : 'Anexar Arquivo'}
                    </span>
                    {stockFile && (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setStockFile(null);
                        }}
                        className="ml-auto p-1 hover:bg-indigo-100 rounded-md transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}

            {stockModal.op === 'remove' && (
              <div className="space-y-4 mb-4">
                <div>
                  <label className="text-[13px] font-semibold text-slate-500 block mb-1">Destinar ao Projeto (Opcional)</label>
                  <select
                    value={stockProject}
                    onChange={e => setStockProject(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Saída Avulsa / Descarte</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.customer_name} - {p.vehicle_model}</option>)}
                  </select>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => { setStockModal(null); setStockFile(null); setStockSupplier(''); setStockProject('') }} 
                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleStockUpdate} 
                disabled={isProcessingStock}
                className={`flex flex-1 justify-center items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white ${stockModal.op === 'add' ? 'bg-indigo-600 hover:bg-indigo-700 border border-indigo-700' : 'bg-red-500 hover:bg-red-600 border border-red-600'} disabled:opacity-50`}
              >
                {isProcessingStock && <Loader2 className="w-4 h-4 animate-spin" />}
                {isProcessingStock ? 'Salvando...' : stockModal.op === 'add' ? 'Confirmar' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Reserve modal */}
      {reserveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-slate-800 mb-1">📅 Reservar Material</h3>
            <p className="text-sm text-slate-500 mb-4">{reserveModal.name}</p>
            
            <label className="text-[13px] font-semibold text-slate-500 block mb-1">Quantidade Reservada</label>
            <input type="number" min="0" value={reserveQty} onChange={e => setReserveQty(e.target.value)}
              className="w-full px-4 py-3 text-lg font-bold text-center border border-slate-200 rounded-xl mb-6 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            
            <div className="flex gap-3">
              <button onClick={() => setReserveModal(null)} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button 
                onClick={handleReserveUpdate} 
                disabled={isProcessingStock}
                className="flex flex-1 justify-center items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 border border-indigo-700 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              >
                {isProcessingStock && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
