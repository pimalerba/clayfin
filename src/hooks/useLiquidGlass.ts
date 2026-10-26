import { useMemo } from 'react';

/**
 * Fallback para Android, Web e ambientes não-iOS.
 * Nunca importa `expo-glass-effect` fora do iOS.
 */
export function canUseLiquidGlass(): boolean {
  return false;
}

export function useLiquidGlass(): boolean {
  return useMemo(() => canUseLiquidGlass(), []);
}
