import { useMemo } from 'react';
import { Platform } from 'react-native';
import {
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import { useAccessibilityPreferences } from './useAccessibilityPreferences';

/**
 * Verifica no iOS se a versão do sistema é 26+ e se as APIs nativas
 * de Liquid Glass (`isLiquidGlassAvailable` e `isGlassEffectAPIAvailable`)
 * estão disponíveis em runtime.
 */
export function canUseLiquidGlass(): boolean {
  if (Platform.OS !== 'ios') {
    return false;
  }

  const majorVersion =
    typeof Platform.Version === 'number'
      ? Platform.Version
      : parseInt(String(Platform.Version), 10);

  if (Number.isNaN(majorVersion) || majorVersion < 26) {
    return false;
  }

  try {
    return Boolean(isLiquidGlassAvailable() && isGlassEffectAPIAvailable());
  } catch {
    return false;
  }
}

/**
 * Retorna `true` somente no iOS 26+ quando a API de Liquid Glass está disponível
 * E a opção de acessibilidade "Reduzir Transparência" NÃO está ativada.
 * Quando "Reduzir Transparência" está ativa, retorna `false` para cair
 * automaticamente no visual sólido Clay.
 */
export function useLiquidGlass(): boolean {
  const { reduceTransparency } = useAccessibilityPreferences();
  const hardwareAndOsSupport = useMemo(() => canUseLiquidGlass(), []);
  return hardwareAndOsSupport && !reduceTransparency;
}
