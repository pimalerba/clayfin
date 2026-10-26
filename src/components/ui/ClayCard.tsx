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
        return ['#9980F2', '#7E61E3'];
      case 'income':
        return ['#E6FAF0', '#D2F3E3'];
      case 'expense':
        return ['#FFECEA', '#FFE0DC'];
      case 'subtle':
        return ['#F6F3FC', '#ECE7F8'];
      case 'default':
      default:
        return ['#FFFFFF', '#F7F4FD'];
    }
  };

  const getInnerShadowColors = (): {
    topHighlight: string;
    bottomShade: string;
  } => {
    if (variant === 'primary') {
      return {
        topHighlight: 'rgba(255, 255, 255, 0.34)',
        bottomShade: 'rgba(65, 42, 148, 0.32)',
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
