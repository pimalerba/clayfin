import React, { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useAppTheme } from '@/theme';

export interface ClayCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  variant?: 'default' | 'primary' | 'income' | 'expense' | 'subtle';
  radius?: 'md' | 'lg' | 'xl' | 'xxl';
  padding?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ClayCard({
  children,
  style,
  contentStyle,
  variant = 'default',
  radius = 'lg',
  padding = 18,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  disabled = false,
}: ClayCardProps) {
  const theme = useAppTheme();
  const scale = useSharedValue(1);
  const borderRadius = theme.radii[radius];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getGradientColors = (): readonly [string, string] => {
    switch (variant) {
      case 'primary':
        return theme.colors.cardGradientPrimary;
      case 'income':
        return theme.colors.cardGradientIncome;
      case 'expense':
        return theme.colors.cardGradientExpense;
      case 'subtle':
        return theme.colors.cardGradientSubtle;
      case 'default':
      default:
        return theme.colors.cardGradientDefault;
    }
  };

  const getInnerShadowColors = (): {
    topHighlight: string;
    bottomShade: string;
  } => {
    if (variant === 'primary') {
      return {
        topHighlight: theme.isDark
          ? 'rgba(255, 255, 255, 0.22)'
          : 'rgba(255, 255, 255, 0.34)',
        bottomShade: theme.isDark
          ? 'rgba(0, 0, 0, 0.45)'
          : 'rgba(65, 42, 148, 0.32)',
      };
    }
    return {
      topHighlight: theme.colors.clayHighlight,
      bottomShade: theme.colors.clayShadowInner,
    };
  };

  const { topHighlight, bottomShade } = getInnerShadowColors();

  const innerContent = (
    <LinearGradient
      colors={getGradientColors()}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.gradientContainer,
        {
          borderRadius,
          padding,
          borderTopColor: topHighlight,
          borderLeftColor: topHighlight,
          borderBottomColor: bottomShade,
          borderRightColor: bottomShade,
        },
        contentStyle,
      ]}
    >
      {children}
    </LinearGradient>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        style={[
          styles.outerShadow,
          theme.shadows.md,
          { borderRadius },
          animatedStyle,
          style,
        ]}
      >
        {innerContent}
      </AnimatedPressable>
    );
  }

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[styles.outerShadow, theme.shadows.md, { borderRadius }, style]}
    >
      {innerContent}
    </View>
  );
}

const styles = StyleSheet.create({
  outerShadow: {
    backgroundColor: 'transparent',
  },
  gradientContainer: {
    overflow: 'hidden',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
});
