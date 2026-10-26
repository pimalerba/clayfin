import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useAccessibilityPreferences } from '@/hooks/useAccessibilityPreferences';
import { useAppTheme } from '@/theme';

export interface ClayButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'income' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ClayButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  style,
  accessibilityLabel,
}: ClayButtonProps) {
  const theme = useAppTheme();
  const { reduceMotion } = useAccessibilityPreferences();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isDisabled = disabled || loading;

  const getGradientColors = (): readonly [string, string] => {
    if (isDisabled) {
      return ['#D9D3EC', '#C8C1DF'];
    }
    switch (variant) {
      case 'primary':
        return ['#9980F2', '#7C5FE0'];
      case 'secondary':
        return ['#FFFFFF', '#F3EFFC'];
      case 'income':
        return ['#54C997', '#38A878'];
      case 'danger':
        return ['#F4837A', '#E35B50'];
      case 'ghost':
        return ['rgba(255,255,255,0.65)', 'rgba(242,239,250,0.65)'];
    }
  };

  const getTextColor = (): string => {
    if (isDisabled) return '#7E76A1';
    if (variant === 'secondary' || variant === 'ghost') {
      return theme.colors.textPrimary;
    }
    return '#FFFFFF';
  };

  const getBorders = () => {
    if (variant === 'secondary' || variant === 'ghost') {
      return {
        top: 'rgba(255, 255, 255, 0.95)',
        bottom: 'rgba(138, 111, 232, 0.18)',
      };
    }
    return {
      top: 'rgba(255, 255, 255, 0.36)',
      bottom: 'rgba(30, 18, 72, 0.28)',
    };
  };

  const borders = getBorders();

  const minHeight = size === 'sm' ? 44 : size === 'lg' ? 56 : 50;
  const horizontalPadding = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;
  const borderRadius = size === 'sm' ? theme.radii.md : theme.radii.lg;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPressIn={() => {
        if (!isDisabled && !reduceMotion) {
          scale.value = withSpring(0.95, { damping: 14, stiffness: 320 });
        }
      }}
      onPressOut={() => {
        if (!reduceMotion) {
          scale.value = withSpring(1, { damping: 14, stiffness: 320 });
        } else {
          scale.value = 1;
        }
      }}
      style={[
        styles.shadowWrapper,
        variant !== 'ghost' && theme.shadows.sm,
        { borderRadius },
        animatedStyle,
        style,
      ]}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.buttonInner,
          {
            minHeight,
            paddingHorizontal: horizontalPadding,
            borderRadius,
            borderTopColor: borders.top,
            borderLeftColor: borders.top,
            borderBottomColor: borders.bottom,
            borderRightColor: borders.bottom,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={getTextColor()} size="small" />
        ) : (
          <View style={styles.contentRow}>
            {icon ? <View style={styles.iconSlot}>{icon}</View> : null}
            <Text
              maxFontSizeMultiplier={2.0}
              style={[
                theme.typography.button,
                size === 'sm' && { fontSize: 14 },
                { color: getTextColor(), flexShrink: 1, textAlign: 'center' },
              ]}
            >
              {title}
            </Text>
          </View>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  shadowWrapper: {
    backgroundColor: 'transparent',
  },
  buttonInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSlot: {
    marginRight: 8,
  },
});
