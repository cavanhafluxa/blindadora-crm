# Evolução do CRM Blindadora — Plano de Implementação

Análise completa da arquitetura atual vs. ProBlind resultou em um roadmap de 3 etapas progressivas. Cada etapa foi desenhada para ser entregue de forma independente e sem quebrar funcionalidades existentes.

---

## Arquitetura Atual (o que já existe)

| Módulo | Status | Qualidade |
|---|---|---|
| Login / Auth | ✅ Implementado | Premium |
| Dashboard | ✅ Implementado | Bom |
| Pipeline de Vendas (Kanban) | ✅ Implementado | Muito Bom |
| Propostas Comerciais | ✅ Implementado | Básico |
| Projetos de Blindagem | ✅ Implementado | Bom |
| 12 Etapas + Fotos | ✅ Implementado | Bom |
| Checklist de Entrada do Veículo | ✅ Implementado | Funcional |
| Financeiro (Receitas/Despesas) | ✅ Implementado | Básico |
| Materiais / Estoque | ✅ Implementado | Básico |
| Pós-Venda / Manutenção | ✅ Implementado | Muito Básico |
| Auditoria | ✅ Implementado | Funcional |
| Gestão de Equipe | ✅ Implementado | Funcional |
| **SICOVAB / Exército** | ❌ Não existe | — |
| **Gerador de PDF** | ❌ Não existe | — |
| **Alertas de Revisão Automática** | ❌ Não existe | — |
| **Portal de Seminovos** | ❌ Não existe | — |

---

## 🟢 Etapa 1 — Impacto Imediato (Quick Wins)

> **Objetivo:** Fechar as lacunas mais visíveis no dia a dia do vendedor e gestor. Tudo que gera valor rápido sem mudar a estrutura do banco de dados.

### 1.1 — Gerador de PDF para Propostas (PDF Export)

**O problema:** As propostas são criadas no sistema mas não existem em papel. O vendedor precisa copiar e colar manualmente.

**A solução:** Botão "Exportar PDF" na tela de Propostas que gera um documento PDF profissional e personalizado com a logomarca da blindadora, itens, valores e assinatura.

**Arquivos a criar/modificar:**

#### [MODIFY] ProposalsClient.tsx
- Adicionar botão **"Gerar PDF"** em cada proposta expandida
- Usar a lib `@react-pdf/renderer` para gerar o documento pelo browser (sem servidor)

#### [NEW] `src/components/ProposalPDF.tsx`
- Template PDF premium com: logo da empresa, dados do cliente, tabela de itens, total, validade, campo de assinatura e rodapé jurídico

#### [NEW] `src/components/PDFDownloadButton.tsx`
- Componente reutilizável que encapsula o `PDFDownloadLink` do `@react-pdf/renderer`

**Dependência a adicionar:**
```
npm install @react-pdf/renderer
```

---

### 1.2 — Gerador de Ordem de Serviço em PDF

**O problema:** Após criar um projeto, não há como imprimir ou enviar para o técnico uma OS formal.

**A solução:** Na página de detalhe do projeto (`/projects/[id]`), adicionar botão **"Gerar OS"** que exporta um PDF com: dados do veículo, lista das 12 etapas, espaço para assinatura do cliente e do técnico responsável.

#### [MODIFY] `src/app/(app)/projects/[id]/page.tsx`
- Adicionar botão "Gerar OS" no cabeçalho da página de detalhe

#### [NEW] `src/components/OrdemServicoPDF.tsx`
- Template PDF da OS com dados do projeto, cliente, veículo, etapas

---

### 1.3 — Redesign Visual "Industrial-Luxury" + Dark Mode

**O problema:** O CRM usa verde genérico e parece um produto SaaS qualquer. O mercado de blindagem é premium.

**A solução:** Atualizar o design system para uma estética automotiva de luxo — dark mode, gradientes refinados, tipografia premium.

**Arquivos a modificar:**

#### [MODIFY] `src/app/globals.css`
- Nova paleta: **Carvão** (`#0F1117`) como base dark, **Âmbar Ouro** (`#F59E0B`) como cor de destaque (trocando o verde genérico), tons de slate escuros
- Adicionar classes `.dark-card`, `.badge-armor` e gradientes premium
- Variáveis CSS para dark mode via `[data-theme="dark"]`

#### [MODIFY] `src/app/(app)/layout.tsx`
- Adicionar sidebar com toggle de Dark/Light Mode
- Agrupar links da sidebar em seções: "Comercial", "Produção", "Gestão"
- Adicionar avatar do usuário logado na base da sidebar

#### [MODIFY] `src/app/(app)/dashboard/page.tsx`
- Novo "Cockpit de Performance" com KPIs animados
- Adicionar métricas: **Ticket Médio**, **Tempo Médio de Pátio**, **Taxa de Conversão do Mês**
- Gráfico de barras simples (CSS puro) de faturamento por mês

---

### 1.4 — Melhorias no Pipeline de Vendas

**O problema:** O Pipeline não tem algumas informações críticas de qualificação.

**A solução:** Enriquecer os cards do Kanban com mais dados de contexto.

#### [MODIFY] `PipelineClient.tsx`
- Adicionar campo **CPF/CNPJ** e **E-mail** nos dados do lead
- Mostrar **data de criação** do lead no card
- Adicionar coluna **"Perdido"** no Kanban para mover leads que não fecharam (tracking de deals perdidos)
- Adicionar **busca/filtro** por nome do cliente acima das colunas

---

> **Banco de dados (Etapa 1):** Apenas adições seguras, sem `DROP` ou `ALTER` destrutivos.

```sql
-- Adicionar campos ao leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS customer_cpf TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;

-- Nova coluna "Perdido" no pipeline
-- (Apenas novo valor aceito no campo pipeline_stage = 'lost')
```

**Estimativa de tamanho:** ~8-10 arquivos modificados, 2-3 criados.

---

## 🟡 Etapa 2 — Processo e Compliance

> **Objetivo:** Atingir paridade funcional com o ProBlind nos pontos de maior dor operacional: conformidade com o Exército e pós-venda automatizado.

### 2.1 — Módulo de Conformidade SICOVAB

**O problema:** Toda blindadora precisa registrar cada veículo junto ao Exército Brasileiro (SICOVAB). Hoje isso é manual, em papel, e sujeito a multas.

**A solução:** Um sub-modulo dentro de cada projeto para controlar os documentos obrigatórios do Exército.

#### [MODIFY] `src/app/(app)/projects/[id]/DocumentsSection.tsx`
- Adicionar seção dedicada **"Controle SICOVAB / Exército"**
- Campos: **N° Autorização do Exército**, **Protocolo SICOVAB**, **Data de Envio**, **Status** (Aguardando, Aprovado, Rejeitado)
- Upload de arquivo do comprovante de protocolo

#### [NEW] Migration SQL: `add_sicovab_fields`
```sql
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS sicovab_protocol TEXT,
  ADD COLUMN IF NOT EXISTS army_authorization TEXT,
  ADD COLUMN IF NOT EXISTS sicovab_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sicovab_status TEXT DEFAULT 'pending';
  -- pending | submitted | approved | rejected
```

#### [MODIFY] `src/app/(app)/projects/page.tsx`
- Adicionar badge **"Pendente SICOVAB"** nos cards de projeto que ainda não têm protocolo registrado

#### [MODIFY] `src/app/(app)/dashboard/page.tsx`
- Adicionar KPI **"Pendências SICOVAB"** (contagem de projetos sem protocolo)

---

### 2.2 — Sistema de Alertas de Revisão Programada (Pós-Venda Inteligente)

**O problema:** Após entregar o carro, a blindadora perde o contato com o cliente. A revisão semestral é obrigatória pela garantia e gera receita recorrente.

**A solução:** Quando um projeto é marcado como **"Concluído"**, o sistema cria automaticamente ordens de revisão programadas para 6 e 12 meses.

#### [MODIFY] `src/app/(app)/projects/[id]/page.tsx`
- Botão **"Marcar como Entregue"** que: (1) altera status para `concluido`, (2) registra a data de entrega, (3) cria automaticamente 2 ordens de revisão

#### [MODIFY] `src/app/(app)/maintenance/MaintenanceClient.tsx`
- Reescrever para UI mais robusta: filtros por status, ordenação por data
- Adicionar badge de urgência (ex: "Revisão em 7 dias!", "Revisão Atrasada!")
- Adicionar campo **"Enviar lembrete via WhatsApp"** que abre o wa.me com mensagem pré-formatada

#### [NEW] Migration SQL: `enhance_maintenance`
```sql
ALTER TABLE maintenance_orders
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'corrective',
  -- corrective | scheduled_6m | scheduled_12m | warranty
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_model TEXT,
  ADD COLUMN IF NOT EXISTS plate TEXT,
  ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;
```

#### [MODIFY] Dashboard
- Adicionar card **"Revisões Esta Semana"** com link direto para o módulo de manutenção

---

### 2.3 — Gerador de Contrato em PDF

**O problema:** Após fechar uma venda, o contrato é feito fora do sistema.

**A solução:** Botão **"Gerar Contrato"** no pipeline (ao converter lead em projeto) ou na proposta aceita, que gera um PDF contendo: cláusulas padrão de blindagem, dados das partes, valor, prazo e campo de assinatura.

#### [NEW] `src/components/ContractPDF.tsx`
- Template de contrato: qualificação das partes, objeto (veículo e nível de blindagem), preço e forma de pagamento, prazo de entrega, garantia (24 meses padrão), cláusulas de rescisão
- Os campos são preenchidos automaticamente a partir dos dados do lead/projeto

#### [MODIFY] `PipelineClient.tsx`
- Ao clicar **"Transformar em Projeto"**, adicionar opção secundária **"Gerar Contrato"** antes de confirmar

**Estimativa Etapa 2:** ~10-12 arquivos modificados, 1-2 migrações SQL, nenhum breaking change.

---

## 🔴 Etapa 3 — Diferenciação Competitiva

> **Objetivo:** Superar o ProBlind com funcionalidades que eles **não oferecem** no pacote básico: marketplace público e analytics avançados.

### 3.1 — Portal de Veículos Blindados (Catálogo Público)

**O problema:** Blindadoras que têm seminovos no estoque não têm onde anunciar de forma profissional.

**A solução:** Uma página pública (sem login) acessível em `/catalogo` com os veículos que o gestor escolheu publicar. O vendedor compartilha o link no WhatsApp.

#### [NEW] `src/app/catalogo/page.tsx`
- Página **pública** (fora do grupo `(app)`) com listagem de veículos disponíveis
- Cards com fotos, modelo, blindagem, preço e botão "Tenho Interesse" (abre WhatsApp)
- Design premium orientado ao cliente final (não ao gestor)

#### [NEW] `src/app/catalogo/[id]/page.tsx`
- Página de detalhe do veículo com galeria de fotos das etapas de produção (prova do trabalho)

#### [MODIFY] `src/app/(app)/projects/[id]/page.tsx`
- Adicionar toggle **"Publicar no Catálogo"** — quando ativado, o veículo aparece na página pública

#### [NEW] Migration SQL: `vehicle_catalog`
```sql
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS published_to_catalog BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS catalog_price DECIMAL,
  ADD COLUMN IF NOT EXISTS catalog_description TEXT,
  ADD COLUMN IF NOT EXISTS contact_whatsapp TEXT;
```

---

### 3.2 — Dashboard Analítico Avançado (Cockpit de Gestão)

**O problema:** O dashboard atual mostra métricas pontuais mas não tem análise temporal ou comparativa.

**A solução:** Substituir o dashboard por um "Cockpit" gerencial completo.

#### [MODIFY] `src/app/(app)/dashboard/page.tsx`
- **Faturamento por Mês** — Gráfico de barras simples (SVG inline)
- **Ranking de Modelos de Veículos** — Top 5 veículos mais blindados
- **Tempo Médio no Pátio** — KPI calculado pela diferença entre criação e conclusão dos projetos
- **Eficiência do Time** — Quais técnicos completaram mais etapas no mês
- **Forecast de Entregas** — Próximas entregas previstas nos próximos 30 dias
- **Análise de Leads Perdidos** — Quantos e quais leads foram para a coluna "Perdido" e qual foi o motivo

---

### 3.3 — Notificações In-App + Alertas Proativos

**O problema:** O gestor precisa abrir o sistema para saber o que está acontecendo.

**A solução:** Um **centro de notificações** persistente na sidebar com alertas automáticos.

#### [NEW] `src/components/NotificationBell.tsx`
- Ícone de sino na topbar com badge de contagem
- Dropdown com notificações: projetos atrasados, revisões pendentes, docs SICOVAB pendentes, leads há mais de 7 dias sem atualização

#### [NEW] Supabase Edge Function: `generate-notifications`
- Função serverless que roda diariamente (via pg_cron ou chamada manual)
- Gera registros na tabela `notifications` com base nas regras de negócio

#### [NEW] Migration SQL: `notifications`
```sql
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'overdue_project' | 'pending_sicovab' | 'revision_due' | 'stale_lead'
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Estimativa Etapa 3:** ~8-10 arquivos novos, 2 migrações SQL, 1 Edge Function.

---

## Cronograma de Desenvolvimento

```
Etapa 1 ─── PDF + Redesign + Pipeline          → ~2-3 sessões
Etapa 2 ─── SICOVAB + Pós-Venda + Contrato     → ~2-3 sessões
Etapa 3 ─── Catálogo + Analytics + Notificações → ~3-4 sessões
```

## Ordem de Implementação (dentro de cada etapa)

Para cada etapa, sempre seguiremos esta sequência para evitar erros:

1. **Migrações SQL** → banco de dados atualizado e seguro
2. **Componentes novos** → criados de forma isolada
3. **Páginas modificadas** → integram os novos componentes
4. **Visual / CSS** → aplicado por último para não interferir no processo

## Regras de Ouro do Desenvolvimento

> [!IMPORTANT]
> - Nunca usar `DROP TABLE` ou `ALTER TABLE` destrutivo nas migrações
> - Todo novo campo usa `ADD COLUMN IF NOT EXISTS` com valor `DEFAULT`
> - Sempre testar a compilação do TS antes de avançar para o próximo arquivo
> - PDFs gerados no client-side (sem Edge Functions) para simplificar

> [!WARNING]
> O Dark Mode da Etapa 1.3 precisa ser implementado sem quebrar o design das outras páginas. Será feito via CSS variables (`data-theme`), garantindo retrocompatibilidade total.
