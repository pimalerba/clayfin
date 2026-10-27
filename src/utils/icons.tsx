import React from 'react';
import {
  Utensils,
  Car,
  Home,
  HeartPulse,
  Gamepad2,
  GraduationCap,
  ShoppingBag,
  MoreHorizontal,
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  Coins,
  BookOpen,
  Music,
  PawPrint,
  Wrench,
  LucideIcon,
} from 'lucide-react-native';
import { useAppTheme } from '@/theme';

export const ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  Car,
  Home,
  HeartPulse,
  Gamepad2,
  GraduationCap,
  ShoppingBag,
  MoreHorizontal,
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  Coins,
  BookOpen,
  Music,
  PawPrint,
  Wrench,
};

export const AVAILABLE_ICON_NAMES = [
  'Utensils',
  'Car',
  'Home',
  'HeartPulse',
  'Gamepad2',
  'GraduationCap',
  'ShoppingBag',
  'Briefcase',
  'Laptop',
  'TrendingUp',
  'Gift',
  'Coins',
  'BookOpen',
  'Music',
  'PawPrint',
  'Wrench',
  'MoreHorizontal',
] as const;

export interface DynamicIconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function DynamicIcon({
  name,
  size = 20,
  color,
  strokeWidth = 2.2,
}: DynamicIconProps) {
  const theme = useAppTheme();
  const resolvedColor = color ?? theme.colors.textPrimary;
  const IconComponent = ICON_MAP[name] ?? MoreHorizontal;
  return <IconComponent size={size} color={resolvedColor} strokeWidth={strokeWidth} />;
}
