import React, { ReactNode } from 'react';
import {
  ColorValue,
  StyleProp,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';

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
 * Fallback do `GlassContainer` para Android, Web e iOS < 26.
 * Não importa `expo-glass-effect` fora do iOS.
 */
export function GlassContainer({
  children,
  style,
  borderRadius,
  tintColor,
  interactive: _interactive,
  spacing: _spacing,
  ...rest
}: GlassContainerProps) {
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
