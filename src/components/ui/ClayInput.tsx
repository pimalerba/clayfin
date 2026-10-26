import React, { ReactNode, useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useAppTheme } from '@/theme';
import { formatCentsForInput, parseCurrencyInputToCents } from '@/utils/currency';

export interface ClayInputProps extends Omit<TextInputProps, 'onChangeText' | 'value'> {
  label?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  errorMessage?: string;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * Se true, ativa máscara monetária da direita para a esquerda (centavos).
   */
  isCurrency?: boolean;
  valueCents?: number;
  onChangeCents?: (cents: number) => void;
}

export function ClayInput({
  label,
  value,
  onChangeText,
  errorMessage,
  leftIcon,
  rightElement,
  containerStyle,
  isCurrency = false,
  valueCents = 0,
  onChangeCents,
  placeholder,
  ...rest
}: ClayInputProps) {
  const theme = useAppTheme();
  const [focused, setFocused] = useState(false);

  const handleTextChange = (raw: string) => {
    if (isCurrency) {
      const nextCents = parseCurrencyInputToCents(raw);
      onChangeCents?.(nextCents);
    } else {
      onChangeText?.(raw);
    }
  };

  const displayValue = isCurrency ? formatCentsForInput(valueCents) : value;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <Text
          style={[
            theme.typography.bodySmall,
            styles.label,
            { color: theme.colors.textSecondary },
          ]}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputOuter,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radii.md,
            borderColor: errorMessage
              ? theme.colors.expense
              : focused
              ? theme.colors.primary
              : 'rgba(138, 111, 232, 0.18)',
          },
        ]}
      >
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}

        <TextInput
          value={displayValue}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          keyboardType={isCurrency ? 'numeric' : rest.keyboardType}
          accessibilityLabel={rest.accessibilityLabel ?? label ?? placeholder}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[
            theme.typography.body,
            styles.input,
            isCurrency && {
              fontFamily: theme.fontFamilies.extraBold,
              fontSize: 22,
              color: theme.colors.textPrimary,
            },
            !isCurrency && { color: theme.colors.textPrimary },
          ]}
          {...rest}
        />

        {rightElement ? <View style={styles.rightSlot}>{rightElement}</View> : null}
      </View>

      {errorMessage ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[
            theme.typography.caption,
            styles.errorText,
            { color: theme.colors.expenseDark },
          ]}
        >
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    marginBottom: 6,
    marginLeft: 4,
    fontWeight: '600',
  },
  inputOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
  },
  leftIcon: {
    marginRight: 10,
  },
  rightSlot: {
    marginLeft: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
  },
  errorText: {
    marginTop: 5,
    marginLeft: 6,
  },
});
