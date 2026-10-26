import React, { ReactNode } from 'react';
import {
  ColorValue,
  StyleProp,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { useAppTheme } from '@/theme';

export type GlassEffectVariant = 'regular' | 'clear' | 'none';

export interface GlassSurfaceProps extends ViewProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Cor de tint aplicada ao vidro no iOS 26+ ou mesclada ao fundo no fallback clay.
   */
  tintColor?: ColorValue;
  /**
   * Define se o efeito de vidro responde ao toque no iOS 26+.
   * @default false
   */
  interactive?: boolean;
  /**
   * Raio de borda da superfície.
   * @default theme.radii.xl (28)
   */
  borderRadius?: number;
  /**
   * Variante do efeito de vidro no iOS 26+.
   * @default 'regular'
   */
  glassStyle?: GlassEffectVariant;
  /**
   * Esquema de cor forçado para o vidro no iOS 26+.
   * @default 'light'
   */
  colorScheme?: 'auto' | 'light' | 'dark';
}

/**
 * Fallback claymorphism para Android, Web e iOS < 26.
 * Não importa `expo-glass-effect` fora do iOS.
 */
export function ClayGlassFallback({
  children,
  style,
  tintColor,
  borderRadius,
  ...rest
}: GlassSurfaceProps) {
  const theme = useAppTheme();
  const resolvedRadius = borderRadius ?? theme.radii.xl;

  return (
    <View
      style={[
        styles.clayFallback,
        theme.shadows.md,
        {
          backgroundColor: tintColor ?? theme.colors.surface,
          borderRadius: resolvedRadius,
          borderTopColor: theme.colors.clayHighlight,
          borderLeftColor: theme.colors.clayHighlight,
          borderBottomColor: theme.colors.clayShadowInner,
          borderRightColor: theme.colors.clayShadowInner,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

export function GlassSurface(props: GlassSurfaceProps) {
  return <ClayGlassFallback {...props} />;
}

const styles = StyleSheet.create({
  clayFallback: {
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    overflow: 'hidden',
  },
});
