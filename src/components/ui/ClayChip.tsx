import React, { ReactNode } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useAccessibilityPreferences } from '@/hooks/useAccessibilityPreferences';
import { useAppTheme } from '@/theme';

export interface ClayChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ClayChip({
  label,
  selected = false,
  onPress,
  icon,
  accentColor,
  style,
  accessibilityLabel,
}: ClayChipProps) {
  const theme = useAppTheme();
  const { reduceMotion } = useAccessibilityPreferences();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const activeColor = accentColor ?? theme.colors.primary;
  const bg = selected ? activeColor : theme.colors.surface;
  const textColor = selected ? '#FFFFFF' : theme.colors.textPrimary;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      onPressIn={() => {
        if (onPress && !reduceMotion) {
          scale.value = withSpring(0.94, { damping: 14, stiffness: 320 });
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
        styles.chip,
        theme.shadows.sm,
        {
          backgroundColor: bg,
          borderRadius: theme.radii.pill,
          borderTopColor: selected
            ? 'rgba(255,255,255,0.38)'
            : theme.colors.clayHighlight,
          borderLeftColor: selected
            ? 'rgba(255,255,255,0.38)'
            : theme.colors.clayHighlight,
          borderBottomColor: selected
            ? 'rgba(25,15,65,0.25)'
            : theme.colors.clayShadowInner,
          borderRightColor: selected
            ? 'rgba(25,15,65,0.25)'
            : theme.colors.clayShadowInner,
        },
        animatedStyle,
        style,
      ]}
    >
      {icon ? <View style={styles.iconSlot}>{icon}</View> : null}
      <Text
        maxFontSizeMultiplier={1.8}
        style={[
          theme.typography.bodySmall,
          {
            color: textColor,
            flexShrink: 1,
            fontFamily: selected
              ? theme.fontFamilies.extraBold
              : theme.fontFamilies.bold,
          },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1.8,
    borderLeftWidth: 1.8,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
  },
  iconSlot: {
    marginRight: 6,
  },
});
