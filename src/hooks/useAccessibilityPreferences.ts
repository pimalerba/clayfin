import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

export interface AccessibilityPreferences {
  reduceTransparency: boolean;
  reduceMotion: boolean;
}

/**
 * Monitora as preferências de acessibilidade do sistema (`AccessibilityInfo`):
 * - `reduceTransparency`: quando ativo no iOS, o app cai para fundos e superfícies
 *   sólidos do design Clay em vez de Liquid Glass translúcido.
 * - `reduceMotion`: quando ativo, desativa animações de mola (spring) e gráficos animados.
 */
export function useAccessibilityPreferences(): AccessibilityPreferences {
  const [reduceTransparency, setReduceTransparency] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(Boolean(enabled));
      })
      .catch(() => {});

    const motionSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        if (mounted) setReduceMotion(Boolean(enabled));
      }
    );

    let transparencySubscription: { remove: () => void } | undefined;

    if (Platform.OS === 'ios') {
      AccessibilityInfo.isReduceTransparencyEnabled()
        .then((enabled) => {
          if (mounted) setReduceTransparency(Boolean(enabled));
        })
        .catch(() => {});

      transparencySubscription = AccessibilityInfo.addEventListener(
        'reduceTransparencyChanged',
        (enabled) => {
          if (mounted) setReduceTransparency(Boolean(enabled));
        }
      );
    }

    return () => {
      mounted = false;
      motionSubscription.remove();
      transparencySubscription?.remove();
    };
  }, []);

  return {
    reduceTransparency,
    reduceMotion,
  };
}
