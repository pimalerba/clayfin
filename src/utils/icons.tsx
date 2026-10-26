import React from 'react';
import {
  Utensils,
  Car,
  Home,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  Wallet,
  MoreHorizontal,
  ShoppingBag,
  Plane,
  PiggyBank,
  Coffee,
  Gift,
  Smartphone,
  Dumbbell,
  Briefcase,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Coins,
  BookOpen,
  Music,
  PawPrint,
  Wrench,
  LucideIcon,
} from 'lucide-react-native';

export const ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  Car,
  Home,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  Wallet,
  MoreHorizontal,
  ShoppingBag,
  Plane,
  PiggyBank,
  Coffee,
  Gift,
  Smartphone,
  Dumbbell,
  Briefcase,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
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
  'Gamepad2',
  'HeartPulse',
  'GraduationCap',
  'Wallet',
  'ShoppingBag',
  'Plane',
  'PiggyBank',
  'Coffee',
  'Gift',
  'Smartphone',
  'Dumbbell',
  'Briefcase',
  'Target',
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
  color = '#2D264B',
  strokeWidth = 2.2,
}: DynamicIconProps) {
  const IconComponent = ICON_MAP[name] ?? MoreHorizontal;
  return <IconComponent size={size} color={color} strokeWidth={strokeWidth} />;
}
