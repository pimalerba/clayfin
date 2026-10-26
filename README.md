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
  app/                 # Rotas do Expo Router
    (tabs)/            # 4 abas: Início, Transações, Orçamento, Mais
      _layout.tsx      # Android/Web: Tabs + ClayTabBar customizada
      _layout.ios.tsx  # iOS: NativeTabs (UITabBarController, SF Symbols, Liquid Glass do sistema)
      more/            # Pilha (Stack) de "Mais": menu, Metas, Relatórios, Ajustes
    onboarding.tsx     # Onboarding de primeira abertura
    transaction-form.tsx  # formSheet nativo no iOS / modal no Android
    category-form.tsx
    goal-form.tsx
    goal-detail.tsx
  components/
    ui/                # Design System Claymorphism (ClayCard, ClayButton, ClayInput, ClayChip, ClayProgressBar, ClayTabBar, ClayModal)
                       # + GlassSurface / GlassContainer / NativeDateField (com variantes .ios.tsx)
    MonthSelector.tsx  # Navegador de mês (AAAA-MM)
    TransactionRow.tsx # Card de transação (swipe Editar/Excluir no iOS)
  db/
    index.ts           # Conexão assíncrona expo-sqlite + PRAGMA foreign_keys = ON
    migrations/        # Sistema de migrations versionadas via PRAGMA user_version
    seed.ts            # Seed idempotente das categorias padrão
  repositories/        # Camada exclusiva de acesso a dados SQL (Category, Transaction, Budget, Goal, Report, Backup)
  hooks/               # Hooks do TanStack Query + useLiquidGlass, useWindowClass, useAccessibilityPreferences
  store/               # Zustand para estado local de UI (mês selecionado e filtros)
  theme/               # Tokens de cores (light + dark mode preparado), tipografia (Nunito), raios e sombras clay
  utils/               # Formatação BRL/centavos, datas pt-BR, cálculo de progresso e validação de backup
  types/               # Interfaces TypeScript estritas
```

---

## Como Rodar o Projeto (Windows + Expo Go)

O projeto é desenvolvido e testado **no Windows, sem Mac e sem conta paga da Apple**: o iPhone roda o app pelo **Expo Go** da App Store e o Android pelo emulador do Android Studio (ou Expo Go num aparelho físico).

### Pré-requisitos
- **Windows 10/11** com **Node.js** LTS (20+ ou 24+) e Git.
- **Expo SDK 58** (React Native 0.88, Expo Router 58) — já fixado no `package.json`.
- **iPhone** com o **Expo Go** (App Store) compatível com o SDK 58.
  - **iOS 26 ou superior** para ver o **Liquid Glass** (vidro nativo). Em iOS anteriores o app funciona normalmente com o visual clay.
  - iOS 27+ habilita janelas redimensionáveis; o layout de duas colunas aparece automaticamente quando a janela tem 600 pt ou mais de largura (ex.: iPhone Duo aberto).
- **Android**: emulador (Android Studio) ou aparelho com Expo Go.
- Todas as bibliotecas usadas estão incluídas no **Expo Go** — **não** é necessário development build nesta etapa (veja [docs/etapa-b.md](docs/etapa-b.md) para o que depende de build nativo).

### 1. Instalar dependências (PowerShell)
```powershell
npm install
```
> Para adicionar pacotes use sempre `npx expo install <pacote>` (resolve versões compatíveis com o SDK 58).

### 2. Iniciar o servidor de desenvolvimento
```powershell
npx expo start
```
- **iPhone**: abra a Câmera e escaneie o QR Code (abre no Expo Go). Se o iPhone não estiver na mesma rede Wi-Fi do PC, ou se o firewall do Windows bloquear, use o túnel:
  ```powershell
  npx expo start --tunnel
  ```
- **Android (emulador)**: com o emulador aberto, pressione `a` no terminal do Expo.
- Pressione `r` para recarregar e `j` para abrir o debugger.

> **Não use** `npx expo run:ios`, `xcodebuild`, `pod install` nem `eas build` para iOS nesta etapa — eles exigem Mac e/ou conta paga da Apple.

### 3. Comandos de Qualidade e Testes
```powershell
npm test               # testes unitários (Jest)
npx tsc --noEmit       # tipagem TypeScript (strict)
npx expo lint          # linter
npx expo-doctor        # diagnóstico de dependências/configuração
npx expo install --check  # versões compatíveis com o SDK 58
```

---

## Experiência nativa de iOS

O app tem uma camada de experiência nativa **exclusiva do iOS**. **Android e web mantêm exatamente o visual e o comportamento clay originais**: todo código nativo de iOS fica em arquivos `.ios.ts(x)` (o Metro só os inclui no bundle de iOS) ou atrás de `Platform.OS === 'ios'`.

| Recurso | iOS | Android / Web |
|---|---|---|
| Barra de abas | `NativeTabs` (UITabBarController) com SF Symbols, minimiza ao rolar e vira barra lateral no iOS 27 / iPhone Duo | `ClayTabBar` customizada |
| Liquid Glass (`expo-glass-effect`) | FAB, `MonthSelector`, botões de voltar/fechar e fundo dos sheets — só no **iOS 26+** com a API disponível | Visual clay |
| Formulários | Sheet nativo (`formSheet` com detents e alça) | Modal com animação de baixo para cima |
| Haptics (`expo-haptics`) | Salvar transação, concluir meta, estourar orçamento, trocar de aba, abrir swipe | Sem vibração (no-op) |
| Swipe nas transações | Deslizar para Editar / Excluir (com confirmação) | Toque na linha (como antes) |
| Seletor de data | `DatePicker` SwiftUI (`@expo/ui/swift-ui`) | Campo de texto `AAAA-MM-DD` |
| Teclado de valores | `number-pad` | `numeric` |
| Layout adaptativo (`useWindowClass`) | Duas colunas e largura máxima de conteúdo quando a janela tem ≥ 600 pt (iPhone Duo aberto, janelas redimensionáveis do iOS 27) | Sempre uma coluna |
| Reduzir Transparência | Liquid Glass passa para o fundo sólido clay | — |

Acessibilidade em todas as plataformas: **Reduzir Movimento** desliga as animações de mola e a animação dos gráficos; textos respeitam o **Dynamic Type** (com limite de escala em botões, chips e linhas para não cortar a fonte Nunito); títulos e controles têm rótulos para o **VoiceOver/TalkBack**.

Regras completas da camada iOS: [docs/ios-regras.md](docs/ios-regras.md). O que depende de build nativo: [docs/etapa-b.md](docs/etapa-b.md).
