## Ambiente e restrições
- Windows, sem Mac e sem conta paga do Apple Developer. Rodo com `npx expo start` (`--tunnel` se precisar) e Expo Go no iPhone; o Android roda no emulador do Windows. Use sintaxe PowerShell
- NUNCA use `npx expo run:ios`, `xcodebuild`, `pod install`, Simulator local nem `eas build` para iOS. Não instale nada que exija development build: confirme antes que o pacote funciona no Expo Go e, se não funcionar, registre em `docs/etapa-b.md` e siga em frente
- Você não vê o iPhone: ao fim de cada fase entregue um checklist curto do que eu devo conferir no aparelho e rode `npx tsc --noEmit`, `npx expo lint` e `npm test`
- Um commit por fase, e pare ao fim de cada fase esperando meu próximo prompt. Não refatore regra de negócio, repositories nem banco

## Estado atual do app (confirme rapidamente antes de mexer)
- Já instalados: expo-glass-effect, @expo/ui, expo-symbols, react-native-safe-area-context, react-native-gesture-handler, react-native-reanimated, react-native-shadow-2, lucide-react-native. Falta expo-haptics
- `src/app/(tabs)/_layout.tsx` usa `Tabs` com a `ClayTabBar` customizada; só 4 abas aparecem (index, transactions, budgets, more), e goals, reports, settings são rotas escondidas dentro de `(tabs)`, abertas via `router.push('/(tabs)/...')` a partir de "Mais"
- `transactions.tsx` usa `SectionList` e um botão flutuante (FAB) Pressable absoluto; as demais telas usam ScrollView
- Formulários (transaction-form, category-form, goal-form) são rotas com `presentation: 'modal'`; `ClayModal` é usado em budgets e goal-detail
- `app.json`: `orientation: "portrait"`, `userInterfaceStyle: "light"`; o tema (`src/theme`) tem lightColors e darkColors, fonte Nunito
- Ícones: lucide-react-native em todo o app

## Regras gerais
- Só iOS para tudo que for nativo: use `Platform.OS === 'ios'` e/ou arquivos `.ios.tsx` com fallback, para o Android nunca importar módulo exclusivo de iOS
- Degradação segura: iOS 26+ usa Liquid Glass; iOS anterior usa o visual clay atual. Antes de qualquer GlassView, verifique `isLiquidGlassAvailable()` e `isGlassEffectAPIAvailable()`
- Design: vidro só em camadas flutuantes/de navegação; cards e conteúdo seguem claymorphism. Não substitua o lucide pelos SF Symbols fora da tab bar
- Antes de usar qualquer API, leia a doc versionada v58 (https://docs.expo.dev/versions/v58.0.0/ e https://docs.expo.dev/llms.txt). Use `npx expo install` para dependências
