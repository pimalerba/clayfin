import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { useAppTheme } from '@/theme';
import { ClayInput } from './ClayInput';

export interface NativeDateFieldProps {
  label?: string;
  value: string;
  onChange: (nextIsoDate: string) => void;
  errorMessage?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Fallback Android/Web para seleção de data: mantém o `ClayInput` original.
 * Nunca importa `@expo/ui/swift-ui`.
 */
export function NativeDateField({
  label = 'Data (AAAA-MM-DD)',
  value,
  onChange,
  errorMessage,
  containerStyle,
}: NativeDateFieldProps) {
  const theme = useAppTheme();

  return (
    <ClayInput
      label={label}
      placeholder="2026-10-26"
      value={value}
      onChangeText={onChange}
      leftIcon={<Calendar size={18} color={theme.colors.textSecondary} />}
      errorMessage={errorMessage}
      containerStyle={containerStyle}
    />
  );
}
