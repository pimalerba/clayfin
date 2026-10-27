# Guia do Agente - Clayfin

Este é o documento de contexto e diretrizes arquiteturais para agentes que forem atuar no **Clayfin**. Leia com atenção antes de realizar qualquer alteração no código.

---

## 1. Visão Geral do Projeto

- **Nome**: Clayfin
- **Propósito**: Aplicativo móvel de controle de finanças pessoais com interface minimalista e tátil no estilo **Claymorphism**.
- **Princípio Fundamental**: **100% offline e local**.
  - Não há backend, servidores, autenticação remota ou sincronização na nuvem por padrão.
  - Toda a persistência é feita via **SQLite** no próprio dispositivo (`expo-sqlite`).
  - O backup é manual, exportado/importado via arquivo JSON estruturado e validado.
- **Localização e Moeda**:
  - Idioma: Português do Brasil (`pt-BR`).
  - Moeda: Real Brasileiro (`BRL`, `R$`).
  - **Valores monetários sempre em centavos (inteiro / `INTEGER`)**: Nunca use números de ponto flutuante para dinheiro na camada de lógica ou banco de dados. Converta para reais apenas na camada de exibição com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` ou use as funções em `src/utils/currency.ts`.

---

## 2. Stack Tecnológica e Versões

- **Framework**: Expo SDK 58 (React Native 0.88, React 19)
- **Roteamento**: Expo Router v4 (rotas em `src/app/`)
- **Linguagem**: TypeScript (Strict Mode ativado em `tsconfig.json`)
- **Persistência Local**: `expo-sqlite` (API moderna e assíncrona: `openDatabaseAsync`, `execAsync`, `runAsync`, `getAllAsync`, `getFirstAsync`, `withTransactionAsync`)
- **Gerenciamento de Estado e Cache**:
  - **TanStack Query (React Query v5)**: Para queries e mutations do banco de dados local (invalidação e sincronização com a UI).
  - **Zustand**: Apenas para estado efêmero de UI (mês selecionado, filtros de busca/categoria em `src/store/useUIStore.ts`).
- **Formulários e Validação**: `react-hook-form` + `zod` com mensagens em pt-BR.
- **Animações e Efeitos Visuais**:
  - `react-native-reanimated` (animações de toque com feedback suave de escala/sombra).
  - `expo-linear-gradient` e `react-native-svg`.
  - `react-native-gifted-charts` (gráficos Donut e Barras).
- **Datas**: `date-fns` configurado com locale `pt-BR`.
- **Ícones**: `lucide-react-native` (mapeados de forma dinâmica em `src/utils/icons.tsx`).
- **Compatibilidade**: 100% compatível com **Expo Go**. Evite adicionar bibliotecas que exijam *native code* não suportado pelo Expo Go sem aviso prévio.

---

## 3. Arquitetura de Pastas e Separação de Camadas

A arquitetura foi desenhada para desacoplar totalmente a UI do mecanismo de persistência, permitindo uma futura troca de SQLite por um backend remoto sem alterar telas ou componentes:

```text
src/
├── app/                 # Rotas do Expo Router (apenas telas e layouts)
│   ├── (tabs)/          # Abas principais (index, transactions, budgets, more, goals, reports, settings)
│   ├── _layout.tsx      # Root layout (Fonts Nunito, QueryClientProvider, SafeArea, SQLite init)
│   ├── onboarding.tsx   # Telas de boas-vindas na primeira inicialização
│   ├── transaction-form.tsx # Modal de criação/edição de receita/despesa
│   ├── category-form.tsx    # Modal de criação/edição de categoria
│   ├── goal-form.tsx        # Modal de criação/edição de meta
│   └── goal-detail.tsx      # Detalhes da meta + aportes/retiradas com histórico
├── components/          # Componentes de UI e feature
│   ├── ui/              # Design System Claymorphism:
│   │   ├── ClayCard.tsx        # Card elevado com gradiente e bordas 3D
│   │   ├── ClayButton.tsx      # Botão animado com Reanimated (onPress spring)
│   │   ├── ClayInput.tsx       # Input de texto e moeda (máscara RTL em centavos)
│   │   ├── ClayChip.tsx        # Chips e seletores de tag/categoria
│   │   ├── ClayProgressBar.tsx # Barra de progresso inflada
│   │   ├── ClayTabBar.tsx      # Barra de navegação inferior clay (exibe 4 abas)
│   │   ├── ClayModal.tsx       # Bottom sheet/modal responsivo
│   │   └── ClayEmptyState.tsx  # Estados vazios e de loading
│   ├── MonthSelector.tsx  # Seletor de mês ativo com paginação
│   └── TransactionRow.tsx # Linha de exibição de transação
├── db/                  # Configuração do banco SQLite
│   ├── migrations/      # Migrations versionadas por PRAGMA user_version
│   ├── seed.ts          # Seed idempotente das 8 categorias padrão
│   └── index.ts         # Inicialização do banco e PRAGMA foreign_keys = ON
├── features/            # Esquemas de validação Zod (schemas.ts)
├── hooks/               # Custom hooks TanStack Query (consomem exclusivamente os repositories)
│   ├── queryKeys.ts
│   ├── useCategories.ts
│   ├── useTransactions.ts
│   ├── useBudgets.ts
│   ├── useGoals.ts
│   ├── useReports.ts
│   └── useBackup.ts
├── repositories/        # Camada EXCLUSIVA de SQL (Transaction, Category, Budget, Goal, Report, Backup)
├── store/               # Zustand UI stores (useUIStore.ts)
├── theme/               # Tokens de cores (light/dark preparado), tipografia Nunito, raios e sombras clay
├── types/               # Tipos TypeScript do domínio (Transaction, Category, Budget, Goal, etc.)
└── utils/               # Funções puras:
    ├── currency.ts      # Centavos <-> BRL, máscara RTL
    ├── date.ts          # Manipulação e formatação pt-BR
    ├── progress.ts      # Cálculos de orçamento, metas e validação de transferências
    ├── backup.ts        # Validação do payload JSON de backup
    ├── icons.tsx        # Mapeamento dinâmico de ícones Lucide
    └── uuid.ts          # Geração de UUID v4 offline
```

---

## 4. Regras de Negócio Críticas

1. **Dinheiro e Saldo em Conta**:
   - Todo dinheiro é representado em centavos (`number` inteiro no TypeScript, `INTEGER` no SQLite).
   - O saldo da conta é **global**: `Saldo Disponível = Total Receitas - Total Despesas - Total Guardado nos Cofrinhos`.
   - **Regra dos Cofrinhos**:
     - Só é possível guardar (`deposit`) se houver saldo disponível em conta (`cents <= availableAccountCents`). Guardar dinheiro abate imediatamente o saldo disponível em conta.
     - Só é possível retirar (`withdraw`) até o valor máximo acumulado no cofrinho (`cents <= currentGoalCents`). Retirar dinheiro devolve o valor imediatamente para o saldo da conta.
     - Essa regra é validada tanto na função pura `validateGoalTransfer` em `src/utils/progress.ts` quanto no `GoalRepository.ts`.

2. **Navegação (Abas Inferiores e Aba Mais)**:
   - A barra inferior (`ClayTabBar.tsx`) renderiza propositalmente apenas **4 abas** para manter a ergonomia e visual limpo:
     1. **Início** (`index`)
     2. **Transações** (`transactions`)
     3. **Orçamento** (`budgets`)
     4. **Mais** (`more`)
   - As telas **Metas** (`goals`), **Relatórios** (`reports`) e **Ajustes** (`settings`) pertencem ao navigator de tabs para manter o layout, mas são acessadas a partir da aba **Mais**.
   - **IMPORTANTE**: Nunca utilize `href: null` nas opções do Expo Router para essas telas no `(tabs)/_layout.tsx`, pois isso desabilita a navegação via `router.push`. A filtragem visual das abas já é feita programaticamente dentro do `ClayTabBar.tsx`.

3. **Exclusão de Categorias**:
   - Se uma categoria possui transações vinculadas, a exclusão direta é bloqueada com aviso. O usuário tem a opção de confirmar e reatribuir automaticamente todas as transações para a categoria padrão **"Outros"**.
   - A categoria padrão `"Outros"` não pode ser excluída.

4. **Orçamentos Mensais**:
   - Alertas visuais automáticos:
     - `< 80%`: Normal.
     - `>= 80%` e `< 100%`: Atenção (`warning`).
     - `>= 100%`: Limite excedido (`exceeded`).

---

## 5. Comandos e Validações

Sempre valide o código antes de declarar tarefas concluídas:

```bash
# Executar servidor Expo
npx expo start

# Executar testes unitários (Jest)
npm test

# Validação estrita de tipos TypeScript
npx tsc --noEmit

# Linter de código
npm run lint
```

*(No Windows PowerShell, caso o script `npx.ps1` apresente erro de permissão, utilize `npx.cmd` ou verifique `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`).*
