import React, { ReactNode } from 'react';
import {
  ColorValue,
  StyleProp,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { GlassContainer as ExpoGlassContainer } from 'expo-glass-effect';
import { useLiquidGlass } from '@/hooks/useLiquidGlass';

export interface GlassContainerProps extends ViewProps {
  children?: ReactNode;
  /**
   * Distância em pontos na qual elementos de vidro próximos começam a se fundir no iOS 26+.
   */
  spacing?: number;
  style?: StyleProp<ViewStyle>;
  tintColor?: ColorValue;
  interactive?: boolean;
  borderRadius?: number;
}

/**
 * Implementação iOS do `GlassContainer`.
 * Usa `GlassContainer` nativo do `expo-glass-effect` no iOS 26+ quando disponível,
 * degradando para `View` em iOS anterior.
 */
export function GlassContainer({
  children,
  spacing = 10,
  style,
  borderRadius,
  tintColor,
  interactive: _interactive,
  ...rest
}: GlassContainerProps) {
  const isLiquidGlass = useLiquidGlass();

  if (!isLiquidGlass) {
    return (
      <View
        style={[
          borderRadius !== undefined ? { borderRadius } : null,
          tintColor ? { backgroundColor: tintColor } : null,
          style,
        ]}
        {...rest}
      >
        {children}
      </View>
    );
  }

  return (
    <ExpoGlassContainer
      spacing={spacing}
      style={[
        borderRadius !== undefined ? { borderRadius } : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </ExpoGlassContainer>
  );
}
