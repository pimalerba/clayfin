import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home,
  ArrowLeftRight,
  PieChart,
  PiggyBank,
  BarChart3,
  Settings,
} from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useAppTheme } from '@/theme';

export interface ClayTabBarProps {
  state: {
    index: number;
    routes: { key: string; name: string; params?: Record<string, any> }[];
  };
  descriptors: Record<
    string,
    {
      options: {
        title?: string;
        tabBarLabel?: any;
      };
    }
  >;
  navigation?: {
    emit: (event: {
      type: string;
      target: string;
      canPreventDefault?: boolean;
    }) => { defaultPrevented?: boolean };
    navigate: (name: string, params?: Record<string, any>) => void;
  };
  emitter?: {
    emit: (event: any) => any;
  };
  navigateToTab?: (routeKey: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TabItemProps {
  label: string;
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

function ClayTabItem({
  label,
  routeName,
  isFocused,
  onPress,
  onLongPress,
}: TabItemProps) {
  const theme = useAppTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconColor = isFocused ? '#FFFFFF' : theme.colors.textSecondary;
  const iconSize = 20;

  const renderIcon = () => {
    switch (routeName) {
      case 'index':
        return <Home size={iconSize} color={iconColor} strokeWidth={2.4} />;
      case 'transactions':
        return <ArrowLeftRight size={iconSize} color={iconColor} strokeWidth={2.4} />;
      case 'budgets':
        return <PieChart size={iconSize} color={iconColor} strokeWidth={2.4} />;
      case 'goals':
        return <PiggyBank size={iconSize} color={iconColor} strokeWidth={2.4} />;
      case 'reports':
        return <BarChart3 size={iconSize} color={iconColor} strokeWidth={2.4} />;
      case 'settings':
      default:
        return <Settings size={iconSize} color={iconColor} strokeWidth={2.4} />;
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={`Aba ${label}`}
      onPressIn={() => {
        scale.value = withSpring(0.92, { damping: 14, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 300 });
      }}
      style={[styles.tabButton, animatedStyle]}
    >
      <View
        style={[
          styles.iconPill,
          isFocused && {
            backgroundColor: theme.colors.primary,
            borderTopColor: 'rgba(255,255,255,0.42)',
            borderLeftColor: 'rgba(255,255,255,0.42)',
            borderBottomColor: 'rgba(40,20,100,0.28)',
            borderRightColor: 'rgba(40,20,100,0.28)',
            borderTopWidth: 1.5,
            borderLeftWidth: 1.5,
            borderBottomWidth: 2.5,
            borderRightWidth: 2.5,
          },
        ]}
      >
        {renderIcon()}
      </View>
      <Text
        numberOfLines={1}
        style={[
          theme.typography.caption,
          styles.tabLabel,
          {
            color: isFocused ? theme.colors.primaryDark : theme.colors.textSecondary,
            fontFamily: isFocused
              ? theme.fontFamilies.extraBold
              : theme.fontFamilies.medium,
          },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

export function ClayTabBar({
  state,
  descriptors,
  navigation,
  emitter,
  navigateToTab,
}: ClayTabBarProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.outerContainer,
        {
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 10),
          backgroundColor: 'transparent',
        },
      ]}
    >
      <View
        style={[
          styles.barSurface,
          theme.shadows.lg,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radii.xl,
            borderTopColor: theme.colors.clayHighlight,
            borderLeftColor: theme.colors.clayHighlight,
            borderBottomColor: theme.colors.clayShadowInner,
            borderRightColor: theme.colors.clayShadowInner,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? String(options.tabBarLabel)
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const eventEmitter = navigation ?? emitter;
            const event = eventEmitter?.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event?.defaultPrevented) {
              if (navigateToTab) {
                navigateToTab(route.key);
              } else {
                navigation?.navigate(route.name, route.params);
              }
            }
          };

          const onLongPress = () => {
            const eventEmitter = navigation ?? emitter;
            eventEmitter?.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <ClayTabItem
              key={route.key}
              label={label}
              routeName={route.name}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  barSurface: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  tabButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPill: {
    width: 40,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10.5,
  },
});
