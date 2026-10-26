import { useMemo } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

/**
 * Ponto único de definição dos breakpoints e métricas de janela adaptativa
 * para o iOS 27 (janelas redimensionáveis) e iPhone Duo (tela interna aberta).
 */
export const WINDOW_CLASS_BREAKPOINTS = {
  /**
   * Largura mínima (em pt) para classificar a janela como `regular` no iOS.
   * Segue a convenção de Horizontal Size Class Regular da Apple (~600pt+:
   * tela interna do iPhone Duo, janelas largas no iOS 27 e iPhones Max/Plus).
   */
  regularMinWidth: 600,
  /**
   * Largura máxima do container de conteúdo quando em modo `regular`,
   * evitando linhas excessivamente longas em janelas muito largas.
   */
  maxContentWidthRegular: 1040,
  /**
   * Largura máxima para formulários e sheets modais em modo `regular`,
   * garantindo campos e botões compactos e confortáveis no centro da tela.
   */
  maxFormWidthRegular: 560,
  /**
   * Espaçamento horizontal padrão entre colunas no modo `regular`.
   */
  columnGapRegular: 18,
} as const;

/**
 * Flag somente `__DEV__` (em código) para forçar o modo `regular` durante inspeção
 * caso não se esteja em uma janela larga / iPhone Duo aberto.
 * Por padrão permanece `false` para que o app detecte automaticamente pelo tamanho da janela.
 */
export const DEV_FORCE_REGULAR_WINDOW_CLASS = false;

export type WindowSizeClass = 'compact' | 'regular';

export interface ResolveWindowClassParams {
  width: number;
  height: number;
  platformOS?: string;
  isDev?: boolean;
  forceRegularInDev?: boolean;
}

export interface WindowClassInfo {
  sizeClass: WindowSizeClass;
  isRegular: boolean;
  isCompact: boolean;
  width: number;
  height: number;
  columns: 1 | 2;
  columnGap: number;
  maxContentWidth: number | undefined;
  maxFormWidth: number | undefined;
  isForcedRegularDev: boolean;
}

/**
 * Função pura que calcula a classe de tamanho da janela (`compact` ou `regular`)
 * exclusivamente a partir das dimensões atuais da janela e da plataforma.
 * - Não utiliza `Dimensions.get`, `Platform.isPad` nem orientação física.
 * - Android e Web permanecem sempre em `compact` para preservar o layout original.
 */
export function resolveWindowClass({
  width,
  height,
  platformOS = Platform.OS,
  isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false,
  forceRegularInDev = false,
}: ResolveWindowClassParams): WindowClassInfo {
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 0;
  const safeHeight = Number.isFinite(height) && height > 0 ? height : 0;

  const isIOS = platformOS === 'ios';
  const isForcedRegularDev = Boolean(isIOS && isDev && forceRegularInDev);
  const isRegular =
    isIOS &&
    (isForcedRegularDev ||
      safeWidth >= WINDOW_CLASS_BREAKPOINTS.regularMinWidth);

  const sizeClass: WindowSizeClass = isRegular ? 'regular' : 'compact';

  return {
    sizeClass,
    isRegular,
    isCompact: !isRegular,
    width: safeWidth,
    height: safeHeight,
    columns: isRegular ? 2 : 1,
    columnGap: isRegular ? WINDOW_CLASS_BREAKPOINTS.columnGapRegular : 0,
    maxContentWidth: isRegular
      ? WINDOW_CLASS_BREAKPOINTS.maxContentWidthRegular
      : undefined,
    maxFormWidth: isRegular
      ? WINDOW_CLASS_BREAKPOINTS.maxFormWidthRegular
      : undefined,
    isForcedRegularDev,
  };
}

/**
 * Hook central reativo ao tamanho da janela (`useWindowDimensions`).
 * Detecta automaticamente quando o iPhone Duo está fechado (`compact`) ou aberto (`regular`),
 * ou quando a janela é redimensionada no iOS 27.
 */
export function useWindowClass(): WindowClassInfo {
  const { width, height } = useWindowDimensions();
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;
  const forceRegularInDev = isDev && DEV_FORCE_REGULAR_WINDOW_CLASS;

  return useMemo(
    () =>
      resolveWindowClass({
        width,
        height,
        platformOS: Platform.OS,
        isDev,
        forceRegularInDev,
      }),
    [width, height, isDev, forceRegularInDev]
  );
}
