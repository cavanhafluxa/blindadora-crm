'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { DollarSign, Package, ShoppingCart, Plus, Trash2, TrendingUp, TrendingDown, Loader2, Receipt, Wrench, Truck, MoreHorizontal, ChevronDown, Upload, X } from 'lucide-react'

type Purchase = {
  id: string
  description: string
  supplier_name: string | null
  quantity: number
  unit_price: number
  total_price: number
  purchase_date: string
  category: string
  notes: string | null
  invoice_url: string | null
}

const CATEGORIES = {
  material: { label: 'Material', icon: Package, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  service: { label: 'Serviço', icon: Wrench, color: 'text-amber-500', bg: 'bg-amber-50' },
  logistics: { label: 'Logística', icon: Truck, color: 'text-orange-500', bg: 'bg-orange-50' },
  other: { label: 'Outro', icon: MoreHorizontal, color: 'text-slate-500', bg: 'bg-slate-50' },
} as const;

type CategoryKey = keyof typeof CATEGORIES;

export default function ProjectCostPanel({
  projectId,
  organizationId,
  contractValue,
  initialPurchases,
  materialCost,
}: {
  projectId: string
  organizationId: string
  contractValue: number
  initialPurchases: Purchase[]
  materialCost: number // soma dos stock outflows com unit_cost
}) {
  const supabase = createClient()
  const [purchases, setPurchases] = useState<Purchase[]>(initialPurchases)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false);
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [form, setForm] = useState({
    description: '',
    supplier_name: '',
    quantity: '1',
    unit_price: '',
    purchase_date: new Date().toISOString().split('T')[0],
    category: 'material',
    notes: '',
    attachment: null as File | null
  })

  const totalPurchases = purchases.reduce((acc, p) => acc + Number(p.total_price), 0)
  const totalCost = materialCost + totalPurchases
  const margin = contractValue - totalCost
  const marginPct = contractValue > 0 ? Math.round((margin / contractValue) * 100) : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.unit_price) return;

    setSaving(true);
    try {
      let invoice_url = null;

      if (form.attachment) {
        const fileExt = form.attachment.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `purchases/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('project_attachments')
          .upload(filePath, form.attachment);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('project_attachments')
          .getPublicUrl(filePath);
        
        invoice_url = publicUrl;
      }

      const total_price = Number(form.quantity) * Number(form.unit_price);
      
      const { data, error } = await supabase
        .from('project_purchases')
        .insert([{
          project_id: projectId,
          organization_id: organizationId,
          description: form.description,
          supplier_name: form.supplier_name,
          quantity: Number(form.quantity),
          unit_price: Number(form.unit_price),
          category: form.category,
          purchase_date: form.purchase_date,
          invoice_url: invoice_url
        }])
        .select()
        .single();

      if (error) throw error;

      setPurchases([data, ...purchases]);
      setForm({
        description: '',
        supplier_name: '',
        quantity: '1',
        unit_price: '',
        category: 'material',
        purchase_date: new Date().toISOString().split('T')[0],
        attachment: null,
        notes: ''
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error adding purchase:', error);
      alert('Erro ao adicionar custo');
    } finally {
      setSaving(false);
    }
  };

  async function handleDelete(id: string) {
    if (!confirm('Excluir este item de custo?')) return
    await supabase.from('project_purchases').delete().eq('id', id)
    setPurchases(prev => prev.filter(p => p.id !== id))
  }

  const marginColor = marginPct >= 30 ? 'text-emerald-600' : marginPct >= 10 ? 'text-amber-600' : 'text-red-600'
  const marginBg = marginPct >= 30 ? 'bg-emerald-50 border-emerald-200' : marginPct >= 10 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'

  return (
    <div className="soft-card p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          <h2 className="font-semibold text-slate-800">Custos & Margem do Projeto</h2>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-[13px] px-3 py-2">
          <Plus className="w-3.5 h-3.5" /> Compra Específica
        </button>
      </div>

      {/* Resumo Financeiro */}
      <div className={`p-4 rounded-2xl border mb-6 ${marginBg}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-wider text-slate-500 mb-1">Contrato</p>
            <p className="text-xl font-black text-emerald-700">R$ {contractValue.toLocaleString('pt-BR')}</p>
          </div>
          <div>
            <p className="text-[13px] font-bold uppercase tracking-wider text-slate-500 mb-1">Custo Materiais</p>
            <p className="text-xl font-black text-slate-700">R$ {materialCost.toLocaleString('pt-BR')}</p>
          </div>
          <div>
            <p className="text-[13px] font-bold uppercase tracking-wider text-slate-500 mb-1">Compras Proj.</p>
            <p className="text-xl font-black text-slate-700">R$ {totalPurchases.toLocaleString('pt-BR')}</p>
          </div>
          <div>
            <p className="text-[13px] font-bold uppercase tracking-wider text-slate-500 mb-1">Margem Bruta</p>
            <div className="flex items-center gap-1.5">
              {margin >= 0 ? <TrendingUp className="w-5 h-5 text-emerald-600" /> : <TrendingDown className="w-5 h-5 text-red-600" />}
              <p className={`text-2xl font-black ${marginColor}`}>R$ {Math.abs(margin).toLocaleString('pt-BR')}</p>
              <span className={`text-base font-black ${marginColor}`}>({marginPct}%)</span>
            </div>
          </div>
        </div>

        {/* Progress bar de margem */}
        <div className="mt-4">
          <div className="flex justify-between text-[13px] font-bold text-slate-500 mb-1">
            <span>Custo Total: R$ {totalCost.toLocaleString('pt-BR')}</span>
            <span>Meta: ≥30% Margem</span>
          </div>
          <div className="h-2 bg-white/60 rounded-full overflow-hidden border border-slate-200">
            <div
              className={`h-full rounded-full transition-all ${marginPct >= 30 ? 'bg-emerald-500' : marginPct >= 10 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(Math.max(marginPct, 0), 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Formulário de Nova Compra */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-5 space-y-4">
          <h3 className="font-semibold text-slate-700 text-sm">Nova Compra Específica</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Descrição *</label>
              <input required type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Ex: Vidro laminado frontal IIIA" className="input-field w-full" />
            </div>
            <div>
              <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Fornecedor</label>
              <input type="text" value={form.supplier_name} onChange={e => setForm(p => ({ ...p, supplier_name: e.target.value }))}
                placeholder="Nome do fornecedor" className="input-field w-full" />
            </div>
            <div>
              <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Categoria</label>
              <div className="relative">
                <button 
                  type="button"
                  onClick={() => setShowCategorySelect(!showCategorySelect)}
                  className="input-field w-full flex items-center gap-3 !pl-3 pr-10 font-semibold text-left h-[42px]"
                >
                  <div className={`w-7 h-7 rounded-lg border border-black/5 flex items-center justify-center ${CATEGORIES[form.category as CategoryKey]?.bg} ${CATEGORIES[form.category as CategoryKey]?.color}`}>
                    {(() => {
                      const Icon = CATEGORIES[form.category as CategoryKey]?.icon || Package;
                      return <Icon className="w-4 h-4" />;
                    })()}
                  </div>
                  <span className="text-[13px]">{CATEGORIES[form.category as CategoryKey]?.label}</span>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown className={`w-4 h-4 transition-transform ${showCategorySelect ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {showCategorySelect && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowCategorySelect(false)} />
                    <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/50 z-20 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      {Object.entries(CATEGORIES).map(([k, { label, icon: Icon, bg, color }]) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => {
                            setForm(p => ({ ...p, category: k }));
                            setShowCategorySelect(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 transition-colors text-left ${form.category === k ? 'bg-slate-50/80' : ''}`}
                        >
                          <div className={`w-8 h-8 rounded-lg border border-black/5 flex items-center justify-center ${bg} ${color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={`text-sm font-semibold ${form.category === k ? 'text-slate-900' : 'text-slate-600'}`}>{label}</span>
                          {form.category === k && (
                            <div className="ml-auto w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div>
              <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Data da Compra</label>
              <input type="date" value={form.purchase_date} onChange={e => setForm(p => ({ ...p, purchase_date: e.target.value }))} className="input-field w-full" />
            </div>
            <div>
              <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Quantidade</label>
              <input required type="number" min="0.001" step="0.001" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} className="input-field w-full" />
            </div>
            <div>
              <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Valor Unitário (R$) *</label>
              <input required type="number" min="0" step="0.01" value={form.unit_price} onChange={e => setForm(p => ({ ...p, unit_price: e.target.value }))}
                placeholder="0,00" className="input-field w-full font-bold text-emerald-700" />
            </div>
            <div>
              <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Comprovante</label>
              <div className="relative">
                <input 
                  type="file" 
                  id="cost-attachment"
                  className="hidden" 
                  accept="image/*,application/pdf"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) setForm(p => ({ ...p, attachment: file }));
                  }}
                />
                <label 
                  htmlFor="cost-attachment"
                  className={`flex items-center gap-2 px-4 h-[38px] rounded-xl border cursor-pointer transition-all ${form.attachment ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}
                >
                  <Upload className={`w-4 h-4 ${form.attachment ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="text-[13px] font-bold truncate max-w-[200px]">
                    {form.attachment ? form.attachment.name : 'Anexar Comprovante'}
                  </span>
                  {form.attachment && (
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setForm(p => ({ ...p, attachment: null }));
                      }}
                      className="ml-auto p-1 hover:bg-indigo-100 rounded-md transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-indigo-400" />
                    </button>
                  )}
                </label>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {saving ? 'Salvando...' : 'Adicionar Custo'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm px-4 py-2 text-slate-500 hover:text-slate-700">Cancelar</button>
          </div>
        </form>
      )}

      {/* Lista de Compras */}
      {purchases.length > 0 && (
        <div>
          <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <ShoppingCart className="w-3.5 h-3.5" /> Compras Específicas do Projeto
          </h3>
          <div className="space-y-2">
            {purchases.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-colors group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 ${CATEGORIES[p.category as CategoryKey]?.bg || 'bg-slate-50'} ${CATEGORIES[p.category as CategoryKey]?.color || 'text-slate-400'} border-black/5 shadow-sm`}>
                    {(() => {
                      const Icon = CATEGORIES[p.category as CategoryKey]?.icon || Package;
                      return <Icon className="w-4 h-4" />;
                    })()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-bold text-slate-900 truncate tracking-tight">{p.description}</p>
                    <p className="text-[13px] font-medium text-slate-500 mt-0.5">
                      {p.supplier_name && <>{p.supplier_name} · </>}
                      {p.quantity}x R$ {Number(p.unit_price).toLocaleString('pt-BR')} ·{' '}
                      {new Date(p.purchase_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-base font-black text-slate-900 mr-2">R$ {Number(p.total_price).toLocaleString('pt-BR')}</span>
                  
                  {p.invoice_url && (
                    <a 
                      href={p.invoice_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-indigo-50 rounded-lg transition-all text-slate-300 hover:text-indigo-600"
                      title="Ver Comprovante"
                    >
                      <Receipt className="w-4 h-4" />
                    </a>
                  )}

                  <button onClick={() => handleDelete(p.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between items-center px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[13px] font-bold text-slate-500">Total Compras Específicas</span>
            <span className="text-sm font-black text-slate-800">R$ {totalPurchases.toLocaleString('pt-BR')}</span>
          </div>
        </div>
      )}

      {purchases.length === 0 && !showForm && (
        <div className="text-center py-6 text-slate-400">
          <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhuma compra específica registrada.</p>
          <p className="text-[13px] mt-1">Itens comprados sob encomenda para este projeto.</p>
        </div>
      )}
    </div>
  )
}
