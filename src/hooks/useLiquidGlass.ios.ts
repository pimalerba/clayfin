import { useMemo } from 'react';
import { Platform } from 'react-native';
import {
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';

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

export function useLiquidGlass(): boolean {
  return useMemo(() => canUseLiquidGlass(), []);
}
