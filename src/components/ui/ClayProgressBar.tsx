import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useAccessibilityPreferences } from '@/hooks/useAccessibilityPreferences';
import { useAppTheme } from '@/theme';
import { BudgetAlertLevel } from '@/utils/progress';

export interface ClayProgressBarProps {
  percentage: number; // 0 a 100+
  alertLevel?: BudgetAlertLevel;
  customColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function ClayProgressBar({
  percentage,
  alertLevel = 'normal',
  customColor,
  height = 16,
  style,
  accessibilityLabel,
}: ClayProgressBarProps) {
  const theme = useAppTheme();
  const { reduceMotion } = useAccessibilityPreferences();
  const clamped = Math.min(100, Math.max(0, percentage));
  const widthProgress = useSharedValue(clamped);

  useEffect(() => {
    if (reduceMotion) {
      widthProgress.value = clamped;
    } else {
      widthProgress.value = withSpring(clamped, {
        damping: 18,
        stiffness: 160,
      });
    }
  }, [clamped, reduceMotion, widthProgress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${widthProgress.value}%`,
  }));

  const getFillColors = (): readonly [string, string] => {
    if (alertLevel === 'exceeded') {
      return ['#F5857C', '#E05348'];
    }
    if (alertLevel === 'warning') {
      return ['#F8B87E', '#EA8C3E'];
    }
    if (customColor) {
      return [customColor, customColor];
    }
    return ['#9A82F3', '#7A5CE0'];
  };

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? `Progresso ${Math.round(percentage)}%`}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
      style={[
        styles.track,
        {
          height,
          borderRadius: height / 2,
          backgroundColor: theme.colors.backgroundSecondary,
          borderTopColor: 'rgba(92, 73, 158, 0.16)',
          borderLeftColor: 'rgba(92, 73, 158, 0.16)',
          borderBottomColor: 'rgba(255, 255, 255, 0.85)',
          borderRightColor: 'rgba(255, 255, 255, 0.85)',
        },
        style,
      ]}
    >
      <Animated.View style={[styles.fillWrapper, fillStyle]}>
        <LinearGradient
          colors={getFillColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.8 }}
          style={[
            styles.fillGradient,
            {
              borderRadius: height / 2,
            },
          ]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
  },
  fillWrapper: {
    height: '100%',
    minWidth: 6,
  },
  fillGradient: {
    flex: 1,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.45)',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.12)',
  },
});
