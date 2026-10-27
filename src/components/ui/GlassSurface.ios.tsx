import React, { ReactNode } from 'react';
import {
  ColorValue,
  StyleProp,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { useLiquidGlass } from '@/hooks/useLiquidGlass';
import { useAppTheme } from '@/theme';

export type GlassEffectVariant = 'regular' | 'clear' | 'none';

export interface GlassSurfaceProps extends ViewProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  tintColor?: ColorValue;
  interactive?: boolean;
  borderRadius?: number;
  glassStyle?: GlassEffectVariant;
  colorScheme?: 'auto' | 'light' | 'dark';
}

export function ClayGlassFallback({
  children,
  style,
  tintColor,
  borderRadius,
  interactive: _interactive,
  glassStyle: _glassStyle,
  colorScheme: _colorScheme,
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

/**
 * Implementação iOS do `GlassSurface`.
 * Usa `GlassView` nativo do `expo-glass-effect` no iOS 26+ quando a API está disponível,
 * degradando para o visual claymorphism em versões anteriores do iOS ou quando
 * o usuário ativa Reduzir Transparência.
 */
export function GlassSurface({
  children,
  style,
  tintColor,
  interactive = false,
  borderRadius,
  glassStyle = 'regular',
  colorScheme,
  ...rest
}: GlassSurfaceProps) {
  const theme = useAppTheme();
  const isLiquidGlass = useLiquidGlass();
  const resolvedRadius = borderRadius ?? theme.radii.xl;
  const effectiveColorScheme = colorScheme ?? (theme.isDark ? 'dark' : 'light');

  if (!isLiquidGlass) {
    return (
      <ClayGlassFallback
        style={style}
        tintColor={tintColor}
        interactive={interactive}
        borderRadius={resolvedRadius}
        glassStyle={glassStyle}
        colorScheme={effectiveColorScheme}
        {...rest}
      >
        {children}
      </ClayGlassFallback>
    );
  }

  return (
    <GlassView
      glassEffectStyle={glassStyle}
      tintColor={tintColor}
      isInteractive={interactive}
      colorScheme={effectiveColorScheme}
      style={[
        styles.glassView,
        { borderRadius: resolvedRadius },
        style,
      ]}
      {...rest}
    >
      {children}
    </GlassView>
  );
}

const styles = StyleSheet.create({
  glassView: {
    overflow: 'hidden',
  },
  clayFallback: {
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    overflow: 'hidden',
  },
});
