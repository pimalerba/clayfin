# Clayfin — Controle de Finanças Pessoais (100% Offline)

**Clayfin** é um aplicativo mobile de finanças pessoais construído com **Expo (React Native) + TypeScript**, projetado com estética **Claymorphism minimalista** e funcionamento **100% local (SQLite)** — sem login, sem contas e sem envio de dados para servidores externos.

---

## Principais Funcionalidades

1. **Receitas e Despesas**:
   - Cadastro, edição e exclusão de transações com valor em centavos (`amount_cents`), tipo, categoria, data e descrição opcional.
   - Listagem agrupada por dia com saldo diário, filtro por mês, tipo (`Receitas` / `Despesas`), categoria e busca instantânea.
2. **Categorias**:
   - 8 categorias padrão criadas automaticamente de forma idempotente na primeira abertura (`Alimentação`, `Transporte`, `Moradia`, `Lazer`, `Saúde`, `Educação`, `Salário`, `Outros`).
   - Criação e edição de categorias personalizadas com escolha de ícone e paleta de cores pastel.
   - Proteção na exclusão: caso uma categoria possua transações vinculadas, o usuário pode confirmar a reatribuição automática para `"Outros"`.
3. **Orçamento Mensal**:
   - Definição de limite de gastos por categoria e por mês (`AAAA-MM`).
   - Barra de progresso `ClayProgressBar` animada com alertas visuais ao atingir **80% (Atenção)** e **100% (Limite Excedido)**.
4. **Metas / Cofrinhos**:
   - Criação de cofrinhos com nome, ícone, valor-alvo e prazo opcional.
   - Aportes (`+`) e retiradas (`-`) com histórico completo de movimentações e percentual concluído.
5. **Gráficos e Relatórios (Consultas SQL Agregadas)**:
   - Resumo mensal calculado via `SUM` e `GROUP BY` no SQLite (Saldo do mês, Total de Receitas, Total de Despesas e Maior Categoria de Gasto).
   - Gráfico Donut de despesas por categoria no mês.
   - Gráfico de Barras comparando Receitas vs. Despesas nos últimos 6 meses.
6. **Backup Manual JSON e Onboarding**:
   - Exportação completa do banco para arquivo `.json` compartilhável via `expo-sharing`.
   - Importação de arquivo `.json` via `expo-document-picker` com validação de esquema (`zod`), verificação de integridade referencial e execução atômica com `withTransactionAsync`.
   - Onboarding de 3 telas na primeira abertura explicando a privacidade local e recomendando backups periódicos.

---

## Arquitetura do Projeto

```text
src/
  app/                 # Rotas do Expo Router (Tabs inferiores + Modais Stack)
    (tabs)/            # Início, Transações, Orçamento, Metas, Relatórios, Ajustes
    onboarding.tsx     # Onboarding de primeira abertura
    transaction-form.tsx
    category-form.tsx
    goal-form.tsx
    goal-detail.tsx
  components/
    ui/                # Design System Claymorphism (ClayCard, ClayButton, ClayInput, ClayChip, ClayProgressBar, ClayTabBar, ClayModal)
    MonthSelector.tsx  # Navegador de mês (AAAA-MM)
    TransactionRow.tsx # Card de item de transação
  db/
    index.ts           # Conexão assíncrona expo-sqlite + PRAGMA foreign_keys = ON
    migrations/        # Sistema de migrations versionadas via PRAGMA user_version
    seed.ts            # Seed idempotente das categorias padrão
  repositories/        # Camada exclusiva de acesso a dados SQL (Category, Transaction, Budget, Goal, Report, Backup)
  hooks/               # Hooks do TanStack Query consumindo os repositories
  store/               # Zustand para estado local de UI (mês selecionado e filtros)
  theme/               # Tokens de cores (light + dark mode preparado), tipografia (Nunito), raios e sombras clay
  utils/               # Formatação BRL/centavos, datas pt-BR, cálculo de progresso e validação de backup
  types/               # Interfaces TypeScript estritas
```

---

## Como Rodar o Projeto

### Pré-requisitos
- **Node.js** (LTS 20+ ou 24+)
- Aplicativo **Expo Go** instalado no celular (Android ou iOS) ou emulador configurado.
  - *Nota*: Todas as bibliotecas utilizadas são 100% compatíveis com o **Expo Go** (não exige *development build* personalizado).

### 1. Instalar dependências
```bash
npm install
```

### 2. Iniciar o servidor de desenvolvimento do Expo
```bash
npx expo start
```
Escaneie o QR Code exibido no terminal com o app **Expo Go** (Android) ou com a Câmera (iOS).

### 3. Comandos de Qualidade e Testes
```bash
# Executar testes unitários (Jest)
npm test

# Verificar tipagem TypeScript (strict mode)
npx tsc --noEmit

# Executar linter do Expo
npx expo lint
```
