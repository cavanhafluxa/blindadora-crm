'use client'

import { 
  LifeBuoy, 
  MessageSquare, 
  Mail, 
  Phone, 
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Zap,
  HelpCircle,
  FileText,
  Monitor
} from 'lucide-react'

export default function SupportPage() {
  const supportChannels = [
    {
      title: 'WhatsApp Direto',
      description: 'Fale com nossa equipe técnica instantaneamente para suporte rápido.',
      icon: MessageSquare,
      action: 'Chamar no WhatsApp',
      link: 'https://wa.me/5511999999999?text=Olá,%20preciso%20de%20suporte%20no%20CRM%20Blindadora.',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      lightColor: 'bg-emerald-50'
    },
    {
      title: 'Suporte por E-mail',
      description: 'Para questões menos urgentes ou envio de documentos e relatórios.',
      icon: Mail,
      action: 'Enviar E-mail',
      link: 'mailto:suporte@blindadora.com.br',
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600',
      lightColor: 'bg-indigo-50'
    },
    {
      title: 'Acesso Remoto',
      description: 'Se solicitado por um técnico, baixe a ferramenta de acesso remoto.',
      icon: Monitor,
      action: 'Baixar AnyDesk',
      link: 'https://anydesk.com/pt/downloads',
      color: 'bg-rose-500',
      textColor: 'text-rose-600',
      lightColor: 'bg-rose-50'
    }
  ]

  const quickLinks = [
    { title: 'Manuais de Uso', icon: FileText },
    { title: 'Dúvidas Frequentes', icon: HelpCircle },
    { title: 'Status do Sistema', icon: Zap },
    { title: 'Segurança de Dados', icon: ShieldCheck },
  ]

  return (
    <div className="px-6 py-8 max-w-[1200px] mx-auto w-full space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Central de Suporte</h1>
          </div>
          <p className="text-slate-500 max-w-md">
            Estamos aqui para ajudar você a aproveitar ao máximo o seu CRM. 
            Escolha um dos canais abaixo para entrar em contato.
          </p>
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="hidden lg:block text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Horário de Atendimento</p>
            <p className="text-sm font-semibold text-slate-700">Seg a Sex, 08h às 18h</p>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-emerald-50 border-t-emerald-500 animate-spin opacity-20" />
        </div>
        
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-full -mr-32 -mt-32 blur-3xl" />
      </div>

      {/* Main Support Channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {supportChannels.map((channel, idx) => (
          <a 
            key={idx}
            href={channel.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-emerald-200 hover:-translate-y-1"
          >
            <div className={`w-12 h-12 ${channel.lightColor} rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110`}>
              <channel.icon className={`w-6 h-6 ${channel.textColor}`} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{channel.title}</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              {channel.description}
            </p>
            <div className={`flex items-center justify-between font-bold text-xs uppercase tracking-widest ${channel.textColor}`}>
              <span>{channel.action}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </a>
        ))}
      </div>

      {/* Quick Links & Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-50/50 p-8 rounded-[32px] border border-dashed border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            Recursos Rápidos
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickLinks.map((link, idx) => (
              <button 
                key={idx}
                className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 text-slate-600 hover:text-emerald-600 hover:border-emerald-100 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3">
                  <link.icon className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
                  <span className="font-semibold text-sm">{link.title}</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#111111] p-8 rounded-[32px] text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-3 tracking-tight">Atendimento Telefônico</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Precisa falar agora? Nossa central está pronta para atender sua ligação.
            </p>
            <a 
              href="tel:+5511999999999" 
              className="inline-flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 px-6 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              <Phone className="w-5 h-5" />
              (11) 99999-9999
            </a>
          </div>
          
          <div className="mt-8 flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest relative z-10">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Suporte Online Agora
          </div>

          {/* Abstract Design Elements */}
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mb-16 -mr-16 blur-2xl" />
        </div>
      </div>
    </div>
  )
}
