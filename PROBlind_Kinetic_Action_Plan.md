# Plano de Ação: Redesign PROBlind "Awwwards + Bento"

Este plano detalha a fusão da **autoridade editorial do Awwwards** com a **dinâmica de cockpit da referência visual** para criar um CRM de blindagem único no mundo.

---

## 🎨 1. DNA Visual (Tokens de Design)

Mesclaremos as fontes e cores raspadas com as formas da print:

*   **Cores (Base Awwwards):**
    *   `bg-main`: `#F8F8F8` (Off-white para respiro)
    *   `bg-card`: `#FFFFFF` (Branco puro para os cards)
    *   `sidebar`: `#000000` (Preto sólido para a pílula)
    *   `primary`: `#FA5D29` (Laranja Awwwards para ações críticas)
    *   `text`: `#222222` (Cinza carvão para legibilidade)
*   **Tipografia:**
    *   Importação da **Inter Tight** (Google Fonts).
    *   Escala: Headlines massivas (`font-weight: 700`) e textos de apoio condensados.
*   **Formas:**
    *   `border-radius: 32px` em todos os cards e na sidebar.
    *   Sombra: `box-shadow: 0 4px 30px rgba(0,0,0,0.03)` (quase imperceptível).

---

## 🛠️ 2. Arquitetura de Componentes

### A. Sidebar Kinetic (The Floating Pill)
Substituir a sidebar atual por uma versão "pílula":
1.  **Fixed Positioning:** `position: fixed`, afastada 20px de cada borda.
2.  **Compact Mode:** Apenas ícones brancos em fundo preto.
3.  **Hover State:** Expansão suave lateral para revelar os labels (`dashboard`, `projetos`, etc.).

### B. Dashboard "Bento Grid"
Reorganizar a página inicial em blocos isolados e arredondados:
1.  **Hero Widget:** Card de boas vindas com ilustração vetorial e status do projeto mais urgente.
2.  **Stats Widgets:** Cards quadrados pequenos para "Projetos em Andamento" e "Leads Novos".
3.  **Performance Chart:** Gráfico de linha minimalista (estilo a print) sem eixos pesados.

### C. Sistema de "Cards Flutuantes"
Todas as páginas (Projetos, Pipeline, Financeiro) serão refatoradas para que o conteúdo principal "flutue" sobre o fundo off-white, eliminando bordas rígidas e divisores de tabela clássicos.

---

## 🗓️ 3. Roadmap de Implementação

### Fase 1: Fundação Estética (`globals.css`)
*   [ ] Injetar a paleta Awwwards via CSS Variables.
*   [ ] Configurar a `Inter Tight` como fonte padrão.
*   [ ] Criar utilitário `.glass-bento` e `.pill-container`.

### Fase 2: Estrutura Root (`layout.tsx` + `Sidebar.tsx`)
*   [ ] Refatoração completa da Sidebar para o formato pílula flutuante.
*   [ ] Ajustar o `main content` para ter um `padding-left` dinâmico que não sobreponha a sidebar.

### Fase 3: Cockpit de Gestão (`dashboard/page.tsx`)
*   [ ] Implementar o Hero Card com o personagem ilustrado.
*   [ ] Converter os gráficos atuais para o estilo minimalista de alta precisão.

---

## 🚀 Diferencial "Anti-Gravity"
Para garantir a autenticidade pedida:
*   **Micro-Animações:** Cada transição de hover na sidebar terá um atraso (stagger) de 0.05s entre os ícones.
*   **Noise Texture:** Aplicar um overlay de ruído sutil (`opacity: 0.02`) para tirar o aspecto "digital chapado".

> [!IMPORTANT]
> Este redesign preservará 100% das funções do CRM atuais. Mudaremos apenas a "pele" e a "alma" da interface.

**Posso iniciar a Fase 1 (Configuração dos novos Tokens e Fontes)?**
