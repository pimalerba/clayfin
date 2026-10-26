# Etapa B — O que depende de build nativo

A Etapa A (fases 0–5, branch `ios-nativo`) foi feita só com o **Expo Go**, no Windows, sem Mac e sem conta paga da Apple. Este documento lista tudo o que ficou de fora por **exigir um build nativo** (development build ou build de loja) e o motivo de cada item.

> **Pré-requisitos gerais da Etapa B**
> - **iOS em aparelho físico:** conta do **Apple Developer Program** (paga) para assinar o app. O EAS Build compila na nuvem, então **não é preciso Mac**, mas sem a conta paga não dá para instalar um build próprio no iPhone (o Expo Go continua sendo a única opção).
> - **Simulador de iOS:** exige Mac (fora do escopo).
> - **Android:** development build pelo EAS sem custo (APK com `distribution: internal`) ou local com Android Studio.
> - Pastas `ios/` e `android/` continuam geradas por CNG (`npx expo prebuild`): toda configuração nativa vai em `app.json` e config plugins, nunca editando essas pastas à mão.

---

## 1. Identificadores do app e `eas.json`

**Situação atual:** o projeto **não tem** `eas.json`, nem `ios.bundleIdentifier` / `android.package` no `app.json`. Não são necessários no Expo Go.

**O que fazer na Etapa B:**
1. Definir os identificadores no `app.json` (ex.: `ios.bundleIdentifier: "com.<seu-nome>.clayfin"`, `android.package: "com.<seu-nome>.clayfin"`).
2. Instalar `expo-dev-client` (`npx expo install expo-dev-client`) para os builds de desenvolvimento.
3. Rodar `bunx`/`npx eas-cli@latest build:configure` e ajustar os perfis. Proposta:

```json
{
  "cli": { "appVersionSource": "remote" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "development-simulator": {
      "extends": "development",
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": { "production": {} }
}
```

| Perfil | Para quê | Motivo |
|---|---|---|
| `development` | Development build com `expo-dev-client`, instalado no aparelho e conectado ao `npx expo start` | Necessário para qualquer módulo nativo que não está no Expo Go (widgets, ícone Liquid Glass, Live Activity). No iOS exige registrar o aparelho (`eas device:create`) e conta paga |
| `development-simulator` | Mesmo build, para o Simulador | Só útil com Mac; mantido para quem tiver um |
| `preview` | Build interno sem dev client (QA, compartilhar com testadores) | Testar o app como o usuário final verá, sem o Metro |
| `production` | Loja (App Store / Google Play) com `autoIncrement` | `eas submit` exige conta paga da Apple e conta do Google Play Console |

Comandos (PowerShell): `npx eas-cli@latest build --profile development --platform android` (Android pode ser feito já) e `--platform ios` (só com a conta paga).

---

## 2. Widgets (`expo-widgets`)

**Ideia para o Clayfin:** widget de tela inicial / bloqueio com o **saldo disponível** e o **uso do orçamento do mês** (barra de progresso), e um widget pequeno com atalho "Nova transação" (deep link `clayfin://transaction-form`).

**Por que ficou para a Etapa B:**
- `expo-widgets` gera um **target de extensão de widget** (WidgetKit/SwiftUI) via config plugin no `prebuild`. **Não roda no Expo Go**, exige development build.
- **Dados compartilhados:** o widget roda em outro processo e **não acessa o SQLite do app**. É preciso um **App Group** (entitlement, configurado pelo plugin) e o app passa a gravar um pequeno *snapshot* (saldo, gasto/limite do mês) a cada mudança relevante. Isso mexe no fluxo de mutações, por isso não entrou na Etapa A (regra: não refatorar regra de negócio/repositories).
- App Groups e entitlements exigem **assinatura com conta paga**.

**Passos:** `npx expo install expo-widgets` → adicionar o plugin no `app.json` → definir os layouts com componentes do `@expo/ui` → gravar o snapshot no App Group após salvar transação/orçamento → `eas build --profile development`.

---

## 3. Live Activity

**Decisão: não implementar.** Live Activities servem para **eventos em andamento com começo e fim** (entrega, corrida, placar, timer). O Clayfin não tem esse tipo de evento: finanças pessoais são consultadas sob demanda, e um orçamento mensal "ativo" o mês inteiro na tela de bloqueio/Dynamic Island iria contra as diretrizes da Apple (e o sistema encerra Live Activities após algumas horas). O widget do item 2 cobre a necessidade de "ver o saldo de relance".

Se no futuro surgir um caso que faça sentido (ex.: contagem regressiva para o vencimento de uma conta no dia), seria feito com o mesmo `expo-widgets` (que também cria Live Activities) e exigiria development build e conta paga.

---

## 4. Módulos e recursos sem suporte no Expo Go

| Item | Situação | Motivo |
|---|---|---|
| `expo-widgets` | Não instalado | Cria target nativo de extensão; não existe no Expo Go (item 2) |
| `expo-dev-client` | Não instalado | Só faz sentido com development build |
| Ícone Liquid Glass (`ios.icon: "./assets/expo.icon"`, formato do Icon Composer) | Já configurado no `app.json`, mas **invisível no Expo Go** | O Expo Go usa o próprio ícone; o ícone em camadas do iOS 26 só aparece num build do app |
| Nome, splash e `userInterfaceStyle` | Configurados, mas no Expo Go vale o comportamento do host | Info.plist/recursos só são gerados no `prebuild` |
| `expo-hinge`, `onHingeChange`, `ArrangementView` | Não usados (ver item 6) | Exigem build compilado com Xcode/SDK do iOS 27.1+ e aparelho com dobradiça; sem necessidade real no app |

Todos os outros módulos usados na Etapa A (`expo-glass-effect`, `@expo/ui` com `DatePicker`, `expo-symbols`, `expo-haptics`, `expo-router/native-tabs`, `react-native-gesture-handler`, `react-native-reanimated`, `expo-sqlite`, `expo-sharing`, `expo-document-picker`) estão incluídos no Expo Go do SDK 58 e foram conferidos no iPhone.

---

## 5. Orientação no iOS 27 (proposta pendente de aprovação)

O `app.json` mantém `orientation: "portrait"`. No iOS 27 (janelas redimensionáveis) e na tela interna do iPhone Duo o sistema pode ignorar essa trava.

**Proposta (não aplicada):** trocar para `orientation: "default"` e travar **só no Android** em runtime com `expo-screen-orientation` (incluído no Expo Go do SDK 58): `lockAsync(OrientationLock.PORTRAIT_UP)` quando `Platform.OS === 'android'`. O layout de iOS já reage ao tamanho da janela (`useWindowClass`), então paisagem/janelas largas funcionariam sem ajuste extra.

**Por que está aqui:** a configuração de orientação vira `UISupportedInterfaceOrientations` / `android:screenOrientation` no `prebuild`. No Expo Go é o host que decide, então o efeito real só pode ser validado num development build.

---

## 6. `expo-hinge` e `ArrangementView` / `onHingeChange` (`@expo/ui/swift-ui`)

### Disponibilidade no SDK 58
- `expo-hinge` (`~58.0.2`) consta em `bundledNativeModules.json` do SDK 58, e o `@expo/ui/swift-ui` (`~58.0.23`) já instalado expõe `ArrangementView` e o modifier `onHingeChange` para iOS 27.1+.
- Ambos só funcionam em builds compilados com o SDK do iOS 27.1+ (Xcode 27.1+) e em aparelhos com dobradiça física (`DeviceHingeContext`). Em iPhones comuns ou iOS anteriores, `hinge` retorna `null` e `ArrangementView` renderiza os filhos sem container.

### Avaliação de necessidade real no Clayfin
1. **Diretriz da Apple e do `@expo/ui` (`hingeObservation.d.ts`):** *"Use hinge state for interactions and effects, not for layout."* O layout para o iPhone Duo aberto e para janelas redimensionáveis deve reagir ao tamanho da janela (`useWindowDimensions` → `useWindowClass()`), não ao ângulo da dobradiça.
2. **Impacto do `ArrangementView` em listas React Native:** é uma view SwiftUI que exige envolver as subárvores em `<Host>` + `<RNHostView>`. Colocar `ScrollView`/`SectionList` dentro de `Host` quebra a detecção do scroll principal pelo `NativeTabs` (`minimizeBehavior="onScrollDown"`, `disableTransparentOnScrollEdge`, `useScrollToTop`).
3. **Decisão:** o Clayfin não tem caso de uso de "modo tenda/tabletop" (visor de câmera, vídeo dividido na dobra), então não há necessidade real de `expo-hinge` nem de `ArrangementView`. Toda a adaptação ao Duo e às janelas do iOS 27 está em `useWindowClass()` e foi testada no iPhone.

---

## 7. Validação que só um build permite

- Comportamento real da tab bar lateral (`sidebarAdaptable`) e do layout de duas colunas **num iPhone Duo físico** com iOS 27.1 (na Etapa A foi validado pelo tamanho da janela).
- Ícone Liquid Glass na tela inicial, splash e nome do app.
- Trava de orientação no Android vinda do `app.json`/runtime (item 5).
- Desempenho com Hermes em build de release (o Expo Go roda em modo de desenvolvimento).
