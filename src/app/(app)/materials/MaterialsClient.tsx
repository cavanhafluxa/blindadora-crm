'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Package, Plus, Trash2, Edit2, AlertTriangle, ArrowUp, ArrowDown, History, Upload, Loader2, Download, DollarSign, Paperclip, CheckCircle, X, BarChart2, TrendingUp, TrendingDown, Users, Search, ShoppingBag, Calendar, ChevronDown } from 'lucide-react'
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  Legend,
  AreaChart,
  Area
} from 'recharts'

type Material = {
  id: string
  name: string
  sku: string | null
  quantity_in_stock: number
  unit_price: number | null
  minimum_stock: number
  reserved_quantity: number
  supplier_id: string | null
  suppliers?: { name: string } | null
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
  projects,
  profiles
}: { 
  initialMaterials: Material[],
  suppliers: any[],
  projects: any[],
  profiles: any[]
}) {
  const supabase = createClient()
  const [materials, setMaterials] = useState<Material[]>(initialMaterials)
  const [movements, setMovements] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'materials' | 'history' | 'price_analysis'>('materials')
  const [selectedPriceAnalysisMaterial, setSelectedPriceAnalysisMaterial] = useState<string | null>(null)
  const [priceAnalysisSearch, setPriceAnalysisSearch] = useState('')
  const [priceHistory, setPriceHistory] = useState<any[]>([])
  const [rawPriceMovements, setRawPriceMovements] = useState<any[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [localSuppliers, setLocalSuppliers] = useState(suppliers)
  const [mounted, setMounted] = useState(false)
  const [priceAnalysisRange, setPriceAnalysisRange] = useState<'30' | '60' | '90' | 'all' | 'custom'>('all')
  const [dateFilter, setDateFilter] = useState({ 
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])
  const [materialPriceTrends, setMaterialPriceTrends] = useState<Record<string, 'up' | 'down' | 'stable'>>({})

  useEffect(() => {
    setMounted(true)
  }, [])

  // Quick Supplier State
  const [isQuickSupplierModalOpen, setIsQuickSupplierModalOpen] = useState(false)
  const [newSupplierData, setNewSupplierData] = useState({
    name: '',
    cnpj: '',
    contact_name: '',
    phone: '',
    email: '',
  })
  const [isSubmittingSupplier, setIsSubmittingSupplier] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [stockModal, setStockModal] = useState<{ id: string; name: string; op: 'add' | 'remove' } | null>(null)
  const [stockQty, setStockQty] = useState('1')
  const [stockSupplier, setStockSupplier] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [stockProject, setStockProject] = useState('')
  const [stockFile, setStockFile] = useState<File | null>(null)
  const [materialFile, setMaterialFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const materialFileInputRef = useRef<HTMLInputElement>(null)
  const [isProcessingStock, setIsProcessingStock] = useState(false)

  const [form, setForm] = useState({ name: '', sku: '', unit_price: '', minimum_stock: '5', quantity_in_stock: '0', reserved_quantity: '0', supplier_id: '' })
  const [saving, setSaving] = useState(false)

  const [reserveModal, setReserveModal] = useState<{ id: string; name: string } | null>(null)
  const [reserveQty, setReserveQty] = useState('0')

  // Multi-select withdrawal state
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [withdrawalItems, setWithdrawalItems] = useState<{ materialId: string, quantity: number }[]>([{ materialId: '', quantity: 1 }])
  const [withdrawalProject, setWithdrawalProject] = useState('')
  const [withdrawalUser, setWithdrawalUser] = useState('')

  // Price history fetcher
  useEffect(() => {
    async function fetchPriceHistory() {
      if (activeTab !== 'price_analysis' || !selectedPriceAnalysisMaterial) return
      
      setIsHistoryLoading(true)
      let query = supabase
        .from('stock_movements')
        .select('created_at, unit_cost, suppliers(name), materials!inner(name)')
        .eq('materials.name', selectedPriceAnalysisMaterial)
        .eq('movement_type', 'in')
        .not('unit_cost', 'is', null)

      if (priceAnalysisRange !== 'all') {
        const start = priceAnalysisRange === 'custom' 
          ? new Date(dateFilter.start).toISOString()
          : new Date(new Date().setDate(new Date().getDate() - parseInt(priceAnalysisRange))).toISOString()
        
        query = query.gte('created_at', start)
        
        if (priceAnalysisRange === 'custom') {
          query = query.lte('created_at', new Date(dateFilter.end + 'T23:59:59').toISOString())
        }
      }

      const { data, error } = await query.order('created_at', { ascending: true })

      if (data) {
        const formattedData = data.map(m => ({
          date: new Date(m.created_at).toLocaleDateString('pt-BR'),
          fullDate: new Date(m.created_at),
          price: Number(m.unit_cost),
          supplier: m.suppliers?.name || 'Manual'
        }))

        // Group by date for Recharts (handling multiple suppliers)
        const chartDataMap: { [key: string]: any } = {}
        formattedData.forEach(item => {
          if (!chartDataMap[item.date]) {
            chartDataMap[item.date] = { date: item.date, fullDate: item.fullDate }
          }
          chartDataMap[item.date][item.supplier] = item.price
        })
        const sortedHistory = Object.values(chartDataMap).sort((a, b) => (a as any).fullDate - (b as any).fullDate)
        setPriceHistory(sortedHistory)
        setRawPriceMovements(formattedData.sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime()))
      }
      setIsHistoryLoading(false)
    }

    fetchPriceHistory()
  }, [activeTab, selectedPriceAnalysisMaterial, priceAnalysisRange, dateFilter])

  // Calculate Price Trends for all materials
  useEffect(() => {
    async function calculateTrends() {
      const { data: movements } = await supabase
        .from('stock_movements')
        .select('material_id, unit_cost, created_at')
        .eq('movement_type', 'in')
        .order('created_at', { ascending: false })
      
      if (!movements) return

      const trends: Record<string, 'up' | 'down' | 'stable'> = {}
      const pricesByMaterial: Record<string, number[]> = {}

      movements.forEach(m => {
        if (!pricesByMaterial[m.material_id]) pricesByMaterial[m.material_id] = []
        if (pricesByMaterial[m.material_id].length < 2) {
          pricesByMaterial[m.material_id].push(Number(m.unit_cost || 0))
        }
      })

      Object.entries(pricesByMaterial).forEach(([mId, prices]) => {
        if (prices.length < 2) {
          trends[mId] = 'stable'
        } else {
          const latest = prices[0]
          const previous = prices[1]
          if (latest > previous) trends[mId] = 'up'
          else if (latest < previous) trends[mId] = 'down'
          else trends[mId] = 'stable'
        }
      })

      setMaterialPriceTrends(trends)
    }

    calculateTrends()
  }, [materials])

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

  const handleQuickSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingSupplier(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const orgId = await getOrgId()
      const { data, error } = await supabase
        .from('suppliers')
        .insert([{
          ...newSupplierData,
          organization_id: orgId
        }])
        .select()
        .single()

      if (error) throw error

      setLocalSuppliers([...localSuppliers, data])
      setForm({ ...form, supplier_id: data.id })
      setStockSupplier(data.id)
      setIsQuickSupplierModalOpen(false)
      setNewSupplierData({
        name: '',
        cnpj: '',
        contact_name: '',
        phone: '',
        email: '',
      })
    } catch (error) {
      console.error('Error adding supplier:', error)
      alert('Erro ao cadastrar fornecedor')
    } finally {
      setIsSubmittingSupplier(false)
    }
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
        supplier_id: form.supplier_id || null,
      }).eq('id', editingId).select('*, suppliers(name)').single()
      if (data) setMaterials(prev => prev.map(m => m.id === editingId ? data as any : m))
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
        supplier_id: form.supplier_id || null,
      }).select('*, suppliers(name)').single()

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
            supplier_id: form.supplier_id || null,
            invoice_url: invoiceUrl,
            unit_cost: form.unit_price ? Number(form.unit_price) : null,
            notes: 'Estoque Inicial'
          })
          if (activeTab === 'history') loadHistory()
        }
      }
    }
    setSaving(false)
    setShowForm(false)
    setMaterialFile(null)
    setForm({ name: '', sku: '', unit_price: '', minimum_stock: '5', quantity_in_stock: '0', reserved_quantity: '0', supplier_id: '' })
  }

  function startEdit(m: any) {
    setForm({ 
      name: m.name, 
      sku: m.sku || '', 
      unit_price: m.unit_price?.toString() || '', 
      minimum_stock: m.minimum_stock.toString(), 
      quantity_in_stock: m.quantity_in_stock.toString(),
      reserved_quantity: m.reserved_quantity.toString(),
      supplier_id: m.supplier_id || ''
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

      // 1. Update material quantity and price if it's an entry
      const updateData: any = { quantity_in_stock: newQty }
      if (stockModal.op === 'add' && newPrice) {
        updateData.unit_price = Number(newPrice.replace(',', '.'))
      }

      const { error: updateError } = await supabase
        .from('materials')
        .update(updateData)
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
        unit_cost: stockModal.op === 'add' ? (newPrice ? Number(newPrice.replace(',', '.')) : Number(currentMaterial.unit_price || 0)) : null
      })

      if (moveError) throw moveError

      // 3. Update local state
      setMaterials(prev => prev.map(m => m.id === stockModal.id ? { 
        ...m, 
        quantity_in_stock: newQty,
        unit_price: (stockModal.op === 'add' && newPrice) ? Number(newPrice.replace(',', '.')) : m.unit_price
      } : m))
      
      // Cleanup
      setStockModal(null)
      setStockQty('1')
      setStockSupplier('')
      setNewPrice('')
      setStockProject('')
      setStockFile(null)
      
      if (activeTab === 'history') loadHistory()
      
    } catch (err: any) {
      alert('Erro ao atualizar estoque: ' + (err.message || err))
    } finally {
      setIsProcessingStock(false)
    }
  }

  async function handleBulkWithdrawal() {
    if (withdrawalItems.some(i => !i.materialId || i.quantity <= 0)) {
      alert('Selecione todos os materiais e quantidades válidas.')
      return
    }

    if (!withdrawalUser) {
      alert('Selecione o responsável pela retirada.')
      return
    }

    setIsProcessingStock(true)
    try {
      const orgId = await getOrgId()

      for (const item of withdrawalItems) {
        const material = materials.find(m => m.id === item.materialId)
        if (!material) continue

        const newQty = material.quantity_in_stock - item.quantity
        if (newQty < 0) {
          alert(`Estoque insuficiente para ${material.name}`)
          throw new Error('Estoque insuficiente')
        }

        // Update Stock
        await supabase.from('materials').update({ quantity_in_stock: newQty }).eq('id', item.materialId)
        
        // Record Movement
        await supabase.from('stock_movements').insert({
          organization_id: orgId,
          material_id: item.materialId,
          movement_type: 'out',
          quantity: item.quantity,
          project_id: withdrawalProject || null,
          user_id: withdrawalUser,
          notes: withdrawalProject ? 'Retirada para projeto' : 'Retirada avulsa'
        })
      }

      // Sync local state
      const updatedMaterials = materials.map(m => {
        const item = withdrawalItems.find(wi => wi.materialId === m.id)
        if (item) return { ...m, quantity_in_stock: m.quantity_in_stock - item.quantity }
        return m
      })
      setMaterials(updatedMaterials)

      setShowWithdrawalModal(false)
      setWithdrawalItems([{ materialId: '', quantity: 1 }])
      setWithdrawalProject('')
      setWithdrawalUser('')
      if (activeTab === 'history') loadHistory()
      
    } catch (err: any) {
      console.error(err)
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
          <div className="flex flex-col items-end gap-4">
            <div className="soft-card px-5 py-3.5 bg-slate-50 border border-slate-100 flex items-center gap-4 min-w-[280px]">
              <div className="p-2.5 bg-indigo-100 rounded-xl">
                <DollarSign className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1.5 text-right">Valor Total em Estoque</p>
                <p className="text-xl font-black text-slate-800 leading-none tracking-tight text-right">
                  R$ {inventoryValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setShowWithdrawalModal(true)}
                className="h-[42px] px-5 bg-white border border-slate-200 text-slate-700 rounded-xl text-[13px] font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
              >
                <ArrowDown className="w-4 h-4 text-red-500" /> Registrar Saída
              </button>
              <button 
                className="h-[42px] px-5 bg-[#111111] text-white rounded-xl text-[13px] font-bold hover:bg-black transition-all flex items-center gap-2 shadow-sm" 
                onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', sku: '', unit_price: '', minimum_stock: '5', quantity_in_stock: '0', reserved_quantity: '0', supplier_id: '' }) }}
              >
                <Plus className="w-4 h-4" /> Novo Material
              </button>
            </div>
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
          onClick={() => setActiveTab('price_analysis')}
          className={`pb-4 px-5 font-semibold text-base transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'price_analysis' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          <BarChart2 className="w-5 h-5" /> Análise de Preços
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
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[13px] font-semibold text-slate-600">Fornecedor (Opcional)</label>
                    <button 
                      type="button"
                      onClick={() => setIsQuickSupplierModalOpen(true)}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      NOVO FORNECEDOR
                    </button>
                  </div>
                  <select 
                    value={form.supplier_id}
                    onChange={e => setForm(p => ({ ...p, supplier_id: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="">Selecione um fornecedor</option>
                    {localSuppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
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
          <div className="soft-card overflow-hidden bg-white border-none shadow-xl shadow-slate-200/50">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="w-12 px-6 py-5"></th>
                    <th className="text-left px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Material / Panorama</th>
                    <th className="text-center px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Fornecedor</th>
                    <th className="text-center px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Estoque Total</th>
                    <th className="text-center px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Reservado</th>
                    <th className="text-center px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Disponível</th>
                    <th className="text-center px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Mínimo</th>
                    <th className="text-right px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Valor / Tendência</th>
                    <th className="text-center px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Movimentar</th>
                    <th className="text-right px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(() => {
                    // Group materials by name
                    const groups: Record<string, Material[]> = {}
                    materials.forEach(m => {
                      if (!groups[m.name]) groups[m.name] = []
                      groups[m.name].push(m)
                    })

                    return Object.entries(groups).map(([name, groupMaterials]) => {
                      const totalStock = groupMaterials.reduce((acc, curr) => acc + curr.quantity_in_stock, 0)
                      const totalReserved = groupMaterials.reduce((acc, curr) => acc + curr.reserved_quantity, 0)
                      const maxPrice = Math.max(...groupMaterials.map(m => Number(m.unit_price || 0)))
                      const isExpanded = expandedGroups.includes(name)
                      const minStock = Math.min(...groupMaterials.map(m => m.minimum_stock))
                      const isLow = totalStock <= minStock

                      const toggleGroup = (name: string) => {
                        setExpandedGroups(prev => isExpanded ? prev.filter(g => g !== name) : [...prev, name])
                      }

                      return (
                        <div key={name} className="contents">
                          <tr 
                            key={name}
                            className={`group cursor-pointer transition-all hover:bg-slate-50/50 ${isExpanded ? 'bg-slate-50/30' : ''}`}
                            onClick={() => toggleGroup(name)}
                          >
                            <td className="px-6 py-5 text-center">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center border border-indigo-100/50">
                                  <Package className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-base font-black text-slate-800 tracking-tight">{name}</span>
                                  <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Panorama Geral</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] bg-slate-100 px-2 py-1 rounded-md">Vários</span>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span className={`text-lg font-black ${isLow ? 'text-amber-500' : 'text-slate-800'}`}>{totalStock}</span>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span className="inline-flex items-center justify-center px-3 py-1 bg-slate-50 text-slate-500 text-[13px] font-bold rounded-lg border border-slate-100">
                                {totalReserved}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span className={`text-lg font-black ${totalStock - totalReserved < minStock ? 'text-red-500' : 'text-emerald-600'}`}>
                                {totalStock - totalReserved}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-center text-[13px] font-bold text-slate-400">{minStock}</td>
                            <td className="px-6 py-5 text-right">
                              <div className="flex flex-col items-end">
                                <span className="text-lg font-black text-slate-800 tabular-nums">
                                  R$ {maxPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Maior Preço Atual</span>
                              </div>
                            </td>
                            <td className="px-6 py-5"></td>
                            <td className="px-6 py-5"></td>
                          </tr>

                          {isExpanded && groupMaterials.map((m) => {
                            const mTrend = materialPriceTrends[m.id] || 'stable'
                            const isMLow = m.quantity_in_stock <= m.minimum_stock
                            
                            return (
                              <tr key={m.id} className="bg-slate-50/40 border-l-4 border-l-indigo-400 animate-in slide-in-from-top-1 duration-200">
                                <td className="px-6 py-4"></td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-indigo-300" />
                                    <div className="flex flex-col">
                                      <span className="text-sm font-black text-slate-600 tracking-tight">{m.name}</span>
                                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Variação de Fornecedor</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="inline-flex items-center px-3 py-1 bg-white border border-slate-100 text-slate-600 text-[11px] font-black uppercase tracking-wider rounded-lg shadow-sm">
                                    {m.suppliers?.name || 'Manual'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className={`text-[15px] font-black ${isMLow ? 'text-amber-500' : 'text-slate-600'}`}>{m.quantity_in_stock}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <button onClick={(e) => { e.stopPropagation(); setReserveModal({ id: m.id, name: m.name }); setReserveQty(m.reserved_quantity.toString()) }} 
                                    className="text-[12px] font-black text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-all">
                                    {m.reserved_quantity}
                                  </button>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className={`text-[15px] font-black ${m.quantity_in_stock - m.reserved_quantity < m.minimum_stock ? 'text-red-500' : 'text-slate-500'}`}>
                                    {m.quantity_in_stock - m.reserved_quantity}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center text-[13px] font-bold text-slate-400">{m.minimum_stock}</td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-3">
                                    <span className="text-[15px] font-black text-slate-700 tabular-nums">
                                      R$ {m.unit_price ? Number(m.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                                    </span>
                                    <div className="flex items-center gap-1 min-w-[20px]">
                                      {mTrend === 'up' && (
                                        <div className="p-1 rounded-md bg-red-50 text-red-500 animate-pulse shadow-sm shadow-red-100">
                                          <TrendingUp className="w-3.5 h-3.5" />
                                        </div>
                                      )}
                                      {mTrend === 'down' && (
                                        <div className="p-1 rounded-md bg-emerald-50 text-emerald-500 animate-pulse shadow-sm shadow-emerald-100">
                                          <TrendingDown className="w-3.5 h-3.5" />
                                        </div>
                                      )}
                                      {mTrend === 'stable' && (
                                        <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-100" title="Preço Estável" />
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center justify-center gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); setStockModal({ id: m.id, name: m.name, op: 'add' }) }} title="Entrada"
                                      className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm shadow-emerald-100 active:scale-95 border border-emerald-100/50">
                                      <Plus className="w-4 h-4" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setStockModal({ id: m.id, name: m.name, op: 'remove' }) }} title="Saída"
                                      className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm shadow-red-100 active:scale-95 border border-red-100/50">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button onClick={(e) => { e.stopPropagation(); startEdit(m) }} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(m.id) }} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><X className="w-4 h-4" /></button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </div>
                      )
                    })
                  })()}
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
                         <div className="font-bold text-slate-700">{m.materials?.name}</div>
                         <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Histórico de Movimento</div>
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

      {activeTab === 'price_analysis' && (
        <div className="animate-in fade-in space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <div className="soft-card p-5 bg-white h-[600px] flex flex-col">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-400" /> Itens em Estoque
                </h3>
                <div className="relative mb-4">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Buscar material..."
                    value={priceAnalysisSearch}
                    onChange={e => setPriceAnalysisSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                  />
                </div>
                <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                  {Array.from(new Set(materials.map(m => m.name)))
                    .filter(name => name.toLowerCase().includes(priceAnalysisSearch.toLowerCase()))
                    .map(name => {
                      const mats = materials.filter(m => m.name === name)
                      const isSelected = selectedPriceAnalysisMaterial === name
                      return (
                        <button
                          key={name}
                          onClick={() => setSelectedPriceAnalysisMaterial(name)}
                          className={`w-full text-left px-4 py-3 rounded-xl transition-all group ${isSelected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'hover:bg-slate-50 text-slate-600'}`}
                        >
                          <div className="font-bold text-[13px] truncate">{name}</div>
                          <div className={`text-[11px] ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                            {mats.length} variação(ões) • R$ {Math.max(...mats.map(m => m.unit_price || 0)).toLocaleString('pt-BR')}
                          </div>
                        </button>
                      )
                    })}
                </div>
              </div>
            </div>

            <div className="md:col-span-3">
              {!selectedPriceAnalysisMaterial ? (
                <div className="soft-card p-12 bg-slate-50 border-dashed border-2 border-slate-200 flex flex-col items-center justify-center h-full text-center">
                  <div className="p-4 bg-indigo-50 rounded-full mb-4">
                    <BarChart2 className="w-8 h-8 text-indigo-500" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-2">Análise de Preços</h3>
                  <p className="text-slate-500 max-w-sm">Selecione um material ao lado para visualizar a evolução de preços e variação por fornecedor.</p>
                </div>
              ) : (
                <div className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="soft-card p-6 bg-white border-l-4 border-l-indigo-500 shadow-lg shadow-slate-100">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Preço Atual (Maior)</p>
                      <div className="flex items-end gap-2">
                        <p className="text-3xl font-black text-slate-800 leading-none tabular-nums">
                          R$ {(() => {
                            const mats = materials.filter(m => m.name === selectedPriceAnalysisMaterial)
                            return Math.max(...mats.map(m => m.unit_price || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                          })()}
                        </p>
                      </div>
                    </div>

                    <div className="soft-card p-6 bg-white border-l-4 border-l-emerald-500 shadow-lg shadow-slate-100">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Média Geral</p>
                      <div className="flex items-end gap-2">
                        <p className="text-3xl font-black text-slate-800 leading-none tabular-nums">
                          R$ {(() => {
                            const mats = materials.filter(m => m.name === selectedPriceAnalysisMaterial)
                            const avg = mats.reduce((acc, curr) => acc + (curr.unit_price || 0), 0) / mats.length
                            return avg.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                          })()}
                        </p>
                      </div>
                    </div>

                    <div className="soft-card p-6 bg-white border-l-4 border-l-amber-500 shadow-lg shadow-slate-100">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Variação no Período</p>
                      <div className="flex items-center gap-3">
                        <p className="text-3xl font-black text-slate-800 leading-none tabular-nums">
                          {(() => {
                            if (priceHistory.length < 2) return '0%'
                            const prices = priceHistory.flatMap(h => Object.values(h).filter(v => typeof v === 'number'))
                            const first = prices[0] || 0
                            const last = prices[prices.length - 1] || 0
                            const diff = first === 0 ? 0 : ((last / first) - 1) * 100
                            return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`
                          })()}
                        </p>
                        {priceHistory.length >= 2 && (
                          <div className={`p-1.5 rounded-xl ${(() => {
                            const prices = priceHistory.flatMap(h => Object.values(h).filter(v => typeof v === 'number'))
                            const first = prices[0] || 0
                            const last = prices[prices.length - 1] || 0
                            return last > first ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'
                          })()}`}>
                            {(() => {
                              const prices = priceHistory.flatMap(h => Object.values(h).filter(v => typeof v === 'number'))
                              const first = prices[0] || 0
                              const last = prices[prices.length - 1] || 0
                              return last > first ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="soft-card p-8 bg-white min-h-[400px]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                      <h3 className="font-black text-slate-800 flex items-center gap-3">
                        Evolução de Preço por Fornecedor
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                          {[
                            { label: '30d', value: '30' },
                            { label: '60d', value: '60' },
                            { label: '90d', value: '90' },
                            { label: 'Tudo', value: 'all' },
                            { label: 'Personalizado', value: 'custom' },
                          ].map((range) => (
                            <button
                              key={range.value}
                              onClick={() => setPriceAnalysisRange(range.value as any)}
                              className={`px-3 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${priceAnalysisRange === range.value ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                              {range.label}
                            </button>
                          ))}
                        </div>

                        {priceAnalysisRange === 'custom' && (
                          <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-300">
                            <input 
                              type="date" 
                              value={dateFilter.start}
                              onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <span className="text-slate-400 font-bold">até</span>
                            <input 
                              type="date" 
                              value={dateFilter.end}
                              onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {isHistoryLoading ? (
                      <div className="h-[300px] flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                      </div>
                    ) : priceHistory.length > 0 && mounted ? (
                      <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={priceHistory}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                              dataKey="date" 
                              axisLine={false}
                              tickLine={false}
                              tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}}
                              dy={10}
                            />
                            <YAxis 
                              axisLine={false}
                              tickLine={false}
                              tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}}
                              tickFormatter={(val) => `R$ ${val}`}
                            />
                            <ChartTooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-[#111111] p-4 rounded-xl border border-slate-800 shadow-2xl">
                                      <p className="text-white text-[11px] font-black uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">{payload[0].payload.date}</p>
                                      <div className="space-y-2.5">
                                        {payload.map((entry, idx) => (
                                          <div key={idx} className="flex items-center justify-between gap-6">
                                            <div className="flex items-center gap-2">
                                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                              <span className="text-slate-400 text-[11px] font-bold">{entry.name}</span>
                                            </div>
                                            <span className="text-white font-black text-[13px]">R$ {Number(entry.value).toLocaleString('pt-BR')}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )
                                }
                                return null
                              }}
                            />
                            <Legend 
                              verticalAlign="top" 
                              align="right" 
                              iconType="circle"
                              wrapperStyle={{ paddingBottom: '30px', fontSize: '11px', fontWeight: 600 }}
                            />
                            {Array.from(new Set(priceHistory.flatMap(d => Object.keys(d).filter(k => k !== 'date' && k !== 'fullDate')))).map((supplier, idx) => {
                              const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#f43f5e']
                              return (
                                <Line
                                  key={supplier}
                                  type="monotone"
                                  dataKey={supplier}
                                  name={supplier}
                                  stroke={colors[idx % colors.length]}
                                  strokeWidth={3}
                                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                  activeDot={{ r: 6, strokeWidth: 0 }}
                                  connectNulls={true}
                                />
                              )
                            })}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-[300px] flex flex-col items-center justify-center text-center">
                        <History className="w-12 h-12 text-slate-200 mb-4" />
                        <p className="text-slate-400 font-medium">Nenhum histórico de compra para este material.</p>
                      </div>
                    )}
                  </div>

                  <div className="soft-card overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-left px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Data</th>
                          <th className="text-left px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Fornecedor</th>
                          <th className="text-right px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Valor Unitário</th>
                          <th className="text-right px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Variação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[...rawPriceMovements].reverse().map((h, i, arr) => {
                          const prev = arr[i + 1]
                          const diff = prev ? ((h.price / prev.price) - 1) * 100 : 0
                          return (
                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 text-slate-600 font-bold">{h.date}</td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider">
                                  {h.supplier}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right font-black text-slate-800">R$ {h.price.toLocaleString('pt-BR')}</td>
                              <td className="px-6 py-4 text-right">
                                {prev ? (
                                  <span className={`inline-flex items-center gap-1 font-bold text-xs ${diff > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {diff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {Math.abs(diff).toFixed(1)}%
                                  </span>
                                ) : <span className="text-slate-300">—</span>}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
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
              <>
                <div className="mb-4">
                  <label className="text-[13px] font-semibold text-slate-500 block mb-1">Preço de Compra (Unitário)</label>
                  <input 
                    type="text" 
                    value={newPrice} 
                    onChange={e => setNewPrice(e.target.value)}
                    placeholder={`Atual: R$ ${materials.find(m => m.id === stockModal.id)?.unit_price || '0,00'}`}
                    className="w-full px-4 py-3 text-base font-bold text-center border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                  />
                </div>
                <div className="space-y-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-700">Fornecedor</label>
                    <button 
                      type="button"
                      onClick={() => setIsQuickSupplierModalOpen(true)}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      NOVO FORNECEDOR
                    </button>
                  </div>
                  <select 
                    value={stockSupplier}
                    onChange={e => setStockSupplier(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
                  >
                    <option value="">Selecione um fornecedor</option>
                    {localSuppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
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
              </>
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
      {/* Withdrawal Modal (Multi-select) */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-[#111111]/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                  <ArrowDown className="w-6 h-6 text-red-500" /> Registrar Saída de Estoque
                </h3>
                <p className="text-slate-500 text-sm mt-1">Selecione os materiais e o destino da retirada.</p>
              </div>
              <button onClick={() => setShowWithdrawalModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
              {/* Materials Selection */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Materiais a retirar</label>
                  <button 
                    onClick={() => setWithdrawalItems(prev => [...prev, { materialId: '', quantity: 1 }])}
                    className="text-[11px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5 hover:text-indigo-700 transition-all"
                  >
                    <Plus className="w-3 h-3" /> Adicionar Item
                  </button>
                </div>
                
                {withdrawalItems.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-end animate-in slide-in-from-left-2 duration-300">
                    <div className="flex-1">
                      <select 
                        value={item.materialId}
                        onChange={e => {
                          const newItems = [...withdrawalItems]
                          newItems[idx].materialId = e.target.value
                          setWithdrawalItems(newItems)
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                      >
                        <option value="">Selecionar Material...</option>
                        {materials.map(m => (
                          <option key={m.id} value={m.id} disabled={withdrawalItems.some((wi, i) => wi.materialId === m.id && i !== idx)}>
                            {m.name} ({m.quantity_in_stock} disponíveis)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <input 
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => {
                          const newItems = [...withdrawalItems]
                          newItems[idx].quantity = parseInt(e.target.value) || 0
                          setWithdrawalItems(newItems)
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-black text-center text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                      />
                    </div>
                    {withdrawalItems.length > 1 && (
                      <button 
                        onClick={() => setWithdrawalItems(prev => prev.filter((_, i) => i !== idx))}
                        className="p-3.5 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Destino (Projeto)</label>
                  <select 
                    value={withdrawalProject}
                    onChange={e => setWithdrawalProject(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  >
                    <option value="">Saída Direta / Descarte</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.customer_name} • {p.vehicle_model}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Responsável pela Retirada</label>
                  <select 
                    value={withdrawalUser}
                    onChange={e => setWithdrawalUser(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  >
                    <option value="">Selecione o usuário...</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button 
                onClick={() => setShowWithdrawalModal(false)}
                className="flex-1 px-8 py-4 border border-slate-200 rounded-2xl text-[13px] font-black text-slate-500 hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleBulkWithdrawal}
                disabled={isProcessingStock}
                className="flex-[2] px-8 py-4 bg-[#111111] text-white rounded-2xl text-[13px] font-black hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200 disabled:opacity-50"
              >
                {isProcessingStock ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                Confirmar Retirada
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Quick Supplier Modal */}
      {isQuickSupplierModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Novo Fornecedor</h2>
                <p className="text-sm text-slate-500">Cadastro rápido de fornecedor</p>
              </div>
              <button onClick={() => setIsQuickSupplierModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickSupplierSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Nome da Empresa *</label>
                <input 
                  type="text" 
                  required
                  value={newSupplierData.name}
                  onChange={e => setNewSupplierData({...newSupplierData, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                  placeholder="Ex: Fábio Distribuidora"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">CNPJ (Opcional)</label>
                  <input 
                    type="text" 
                    value={newSupplierData.cnpj}
                    onChange={e => setNewSupplierData({...newSupplierData, cnpj: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                    placeholder="00.000.000/0001-00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Contato</label>
                  <input 
                    type="text" 
                    value={newSupplierData.contact_name}
                    onChange={e => setNewSupplierData({...newSupplierData, contact_name: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                    placeholder="Nome do vendedor"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Telefone</label>
                  <input 
                    type="text" 
                    value={newSupplierData.phone}
                    onChange={e => setNewSupplierData({...newSupplierData, phone: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">E-mail</label>
                  <input 
                    type="email" 
                    value={newSupplierData.email}
                    onChange={e => setNewSupplierData({...newSupplierData, email: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                    placeholder="contato@empresa.com"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmittingSupplier}
                  className="flex-1 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingSupplier ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cadastrar Fornecedor'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsQuickSupplierModalOpen(false)}
                  className="px-6 py-3 border border-slate-100 rounded-xl font-bold hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
