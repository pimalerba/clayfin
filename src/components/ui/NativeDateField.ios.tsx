import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { DatePicker, Host } from '@expo/ui/swift-ui';
import { datePickerStyle, labelsHidden } from '@expo/ui/swift-ui/modifiers';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react-native';
import { useAppTheme } from '@/theme';
import { formatDateShortPtBR } from '@/utils/date';

export interface NativeDateFieldProps {
  label?: string;
  value: string;
  onChange: (nextIsoDate: string) => void;
  errorMessage?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

function parseIsoDateLocalNoon(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const d = new Date(year, month, day, 12, 0, 0);
    if (!Number.isNaN(d.getTime())) {
      return d;
    }
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
}

/**
 * Implementação iOS nativa de seleção de data usando `DatePicker` SwiftUI (`@expo/ui/swift-ui`),
 * adaptado dinamicamente para modo claro ou escuro.
 */
export function NativeDateField({
  label = 'Data',
  value,
  onChange,
  errorMessage,
  containerStyle,
}: NativeDateFieldProps) {
  const theme = useAppTheme();
  const selectedDate = useMemo(() => parseIsoDateLocalNoon(value), [value]);

  const handleDateChange = (nextDate: Date) => {
    if (!nextDate || Number.isNaN(nextDate.getTime())) return;
    const formatted = format(nextDate, 'yyyy-MM-dd');
    if (formatted !== value) {
      onChange(formatted);
    }
  };

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
            backgroundColor: theme.colors.inputBackground,
            borderRadius: theme.radii.md,
            borderColor: errorMessage
              ? theme.colors.expense
              : theme.colors.inputBorder,
          },
        ]}
      >
        <View style={styles.leftRow}>
          <Calendar size={18} color={theme.colors.textSecondary} />
          <Text
            style={[
              theme.typography.body,
              {
                color: theme.colors.textPrimary,
                marginLeft: 10,
                fontFamily: theme.fontFamilies.bold,
              },
            ]}
          >
            {formatDateShortPtBR(value)}
          </Text>
        </View>

        <Host
          matchContents
          alignment="trailing"
          colorScheme={theme.isDark ? 'dark' : 'light'}
          seedColor={theme.colors.primary}
          style={styles.host}
        >
          <DatePicker
            title="Selecionar data"
            selection={selectedDate}
            displayedComponents={['date']}
            modifiers={[datePickerStyle('compact'), labelsHidden()]}
            onDateChange={handleDateChange}
          />
        </Host>
      </View>

      {errorMessage ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[
            theme.typography.caption,
            styles.errorText,
            { color: theme.colors.expense },
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
    justifyContent: 'space-between',
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 8,
  },
  host: {
    minHeight: 38,
    minWidth: 130,
  },
  errorText: {
    marginTop: 5,
    marginLeft: 6,
  },
});
