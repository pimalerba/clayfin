import { TextStyle, ViewStyle } from 'react-native';
import { lightColors, darkColors, ThemeColors, CATEGORY_PRESET_COLORS } from './colors';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 44,
} as const;

export const radii = {
  sm: 14,
  md: 20,
  lg: 24,
  xl: 28,
  xxl: 32,
  pill: 999,
} as const;

export const fontFamilies = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extraBold: 'Nunito_800ExtraBold',
} as const;

export const typography: Record<string, TextStyle> = {
  hero: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 32,
    lineHeight: 40,
  },
  h1: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 24,
    lineHeight: 32,
  },
  h2: {
    fontFamily: fontFamilies.bold,
    fontSize: 20,
    lineHeight: 28,
  },
  h3: {
    fontFamily: fontFamilies.bold,
    fontSize: 17,
    lineHeight: 24,
  },
  body: {
    fontFamily: fontFamilies.medium,
    fontSize: 15,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 16,
    lineHeight: 22,
  },
};

export const clayShadows: Record<'sm' | 'md' | 'lg', ViewStyle> = {
  sm: {
    shadowColor: '#5C499E',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 4,
  },
  md: {
    shadowColor: '#5C499E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 7,
  },
  lg: {
    shadowColor: '#5C499E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 11,
  },
};

export interface AppTheme {
  colors: ThemeColors;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  fontFamilies: typeof fontFamilies;
  shadows: typeof clayShadows;
  isDark: boolean;
}

export const lightTheme: AppTheme = {
  colors: lightColors,
  spacing,
  radii,
  typography,
  fontFamilies,
  shadows: clayShadows,
  isDark: false,
};

export const darkTheme: AppTheme = {
  colors: darkColors,
  spacing,
  radii,
  typography,
  fontFamilies,
  shadows: clayShadows,
  isDark: true,
};

export function useAppTheme(): AppTheme {
  return lightTheme;
}

export { lightColors, darkColors, CATEGORY_PRESET_COLORS };
export type { ThemeColors };
