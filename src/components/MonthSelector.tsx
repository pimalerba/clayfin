import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react-native';
import { useAppTheme } from '@/theme';
import { useLiquidGlass } from '@/hooks/useLiquidGlass';
import { formatMonthYearPtBR, shiftMonth } from '@/utils/date';
import { ClayCard, GlassContainer, GlassSurface } from '@/components/ui';

export interface MonthSelectorProps {
  selectedMonth: string; // yyyy-MM
  onChangeMonth: (month: string) => void;
}

export function MonthSelector({
  selectedMonth,
  onChangeMonth,
}: MonthSelectorProps) {
  const theme = useAppTheme();
  const isLiquidGlass = useLiquidGlass();

  if (isLiquidGlass) {
    return (
      <GlassContainer spacing={10} style={styles.container}>
        <View style={styles.glassRow}>
          <Pressable
            onPress={() => onChangeMonth(shiftMonth(selectedMonth, -1))}
            accessibilityRole="button"
            accessibilityLabel="Mês anterior"
          >
            <GlassSurface
              interactive
              tintColor="rgba(122, 90, 248, 0.16)"
              borderRadius={18}
              style={styles.glassArrowBtn}
            >
              <ChevronLeft
                size={20}
                color={theme.colors.textPrimary}
                strokeWidth={2.4}
              />
            </GlassSurface>
          </Pressable>

          <GlassSurface
            interactive
            tintColor="rgba(122, 90, 248, 0.12)"
            borderRadius={20}
            style={styles.glassCenterPill}
          >
            <Calendar
              size={16}
              color={theme.colors.primaryDark}
              strokeWidth={2.3}
              style={{ marginRight: 6 }}
            />
            <Text
              accessibilityRole="header"
              accessibilityLabel={`Mês selecionado: ${formatMonthYearPtBR(
                selectedMonth
              )}`}
              maxFontSizeMultiplier={2.0}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              numberOfLines={1}
              style={[
                theme.typography.h3,
                styles.highContrastText,
                { color: theme.colors.textPrimary, flexShrink: 1 },
              ]}
            >
              {formatMonthYearPtBR(selectedMonth)}
            </Text>
          </GlassSurface>

          <Pressable
            onPress={() => onChangeMonth(shiftMonth(selectedMonth, 1))}
            accessibilityRole="button"
            accessibilityLabel="Próximo mês"
          >
            <GlassSurface
              interactive
              tintColor="rgba(122, 90, 248, 0.16)"
              borderRadius={18}
              style={styles.glassArrowBtn}
            >
              <ChevronRight
                size={20}
                color={theme.colors.textPrimary}
                strokeWidth={2.4}
              />
            </GlassSurface>
          </Pressable>
        </View>
      </GlassContainer>
    );
  }

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
            accessibilityRole="header"
            accessibilityLabel={`Mês selecionado: ${formatMonthYearPtBR(
              selectedMonth
            )}`}
            maxFontSizeMultiplier={2.0}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            numberOfLines={1}
            style={[
              theme.typography.h3,
              { color: theme.colors.textPrimary, flexShrink: 1 },
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
  glassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  arrowBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassArrowBtn: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassCenterPill: {
    flex: 1,
    minHeight: 46,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highContrastText: {
    fontWeight: '800',
  },
});
