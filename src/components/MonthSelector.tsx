import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react-native';
import { useAppTheme } from '@/theme';
import { formatMonthYearPtBR, shiftMonth } from '@/utils/date';
import { ClayCard } from '@/components/ui';

export interface MonthSelectorProps {
  selectedMonth: string; // yyyy-MM
  onChangeMonth: (month: string) => void;
}

export function MonthSelector({
  selectedMonth,
  onChangeMonth,
}: MonthSelectorProps) {
  const theme = useAppTheme();

  return (
    <ClayCard radius="xl" padding={8} style={styles.container}>
      <View style={styles.row}>
        <Pressable
          onPress={() => onChangeMonth(shiftMonth(selectedMonth, -1))}
          accessibilityRole="button"
          accessibilityLabel="Mês anterior"
          style={[
            styles.arrowBtn,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <ChevronLeft size={20} color={theme.colors.textPrimary} />
        </Pressable>

        <View style={styles.centerLabel}>
          <Calendar
            size={16}
            color={theme.colors.primary}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              theme.typography.h3,
              { color: theme.colors.textPrimary },
            ]}
          >
            {formatMonthYearPtBR(selectedMonth)}
          </Text>
        </View>

        <Pressable
          onPress={() => onChangeMonth(shiftMonth(selectedMonth, 1))}
          accessibilityRole="button"
          accessibilityLabel="Próximo mês"
          style={[
            styles.arrowBtn,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <ChevronRight size={20} color={theme.colors.textPrimary} />
        </Pressable>
      </View>
    </ClayCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrowBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
