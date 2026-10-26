# Etapa B — Registro de Módulos e Recursos Avaliados

## `expo-hinge` e `ArrangementView` / `onHingeChange` (`@expo/ui/swift-ui`)

### Disponibilidade no SDK 58 / Expo Go
- O pacote `expo-hinge` (`~58.0.2`) consta em `bundledNativeModules.json` do Expo SDK 58, e o pacote `@expo/ui/swift-ui` (`~58.0.23`) já instalado expõe `ArrangementView` e o modifier `onHingeChange` para iOS 27.1+.
- Ambos operam apenas em builds compilados com o SDK do iOS 27.1+ (Xcode 27.1+) e em aparelhos com dobradiça física (`DeviceHingeContext`); em iPhones convencionais ou versões anteriores do iOS, `hinge` retorna `null` e `ArrangementView` renderiza os filhos sem container.

### Avaliação de necessidade real no Clayfin
1. **Diretriz oficial da Apple e do Expo SDK 58 (`hingeObservation.d.ts`):**
   - A própria documentação do `@expo/ui` orienta explicitamente: *"Use hinge state for interactions and effects, not for layout."*
   - O layout adaptativo para o iPhone Duo (tela interna aberta) e para janelas redimensionáveis do iOS 27 deve reagir às dimensões/size classes da janela (`useWindowDimensions` -> `useWindowClass()`), e não ao ângulo físico da dobradiça.
2. **Impacto técnico do `ArrangementView` sobre listas React Native:**
   - `ArrangementView` é uma view SwiftUI que exige envolver subárvores em `<Host>` + `<RNHostView>`. Envolver `ScrollView` ou `SectionList` do React Native dentro de `Host` interrompe a detecção automática do scroll primário pelo `NativeTabs` (`minimizeBehavior="onScrollDown"`, `disableTransparentOnScrollEdge` e `useScrollToTop`).
3. **Decisão:**
   - Como o Clayfin é um app de finanças pessoais sem caso de uso de "modo tenda/tabletop" (como visor de câmera ou player de vídeo dividido na dobra física), não há necessidade real de acoplar telas ao `expo-hinge` ou `ArrangementView`.
   - Toda a adaptação para a tela interna do iPhone Duo e janelas redimensionáveis do iOS 27 foi implementada em `useWindowClass()` com `useWindowDimensions()`, garantindo funcionamento consistente tanto no iPhone Duo quanto em janelas redimensionadas e modo paisagem.
