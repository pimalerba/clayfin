import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import {
  ArrowDownCircle,
  ArrowLeft,
  ArrowUpCircle,
  BarChart3,
  Flame,
  PiggyBank,
  Wallet,
} from 'lucide-react-native';
import { useAppTheme } from '@/theme';
import {
  useExpensesByCategory,
  useLastSixMonthsCashflow,
  useMonthlySummary,
} from '@/hooks';
import { useUIStore } from '@/store/useUIStore';
import {
  ClayCard,
  ClayEmptyState,
  ClayLoadingState,
} from '@/components/ui';
import { MonthSelector } from '@/components/MonthSelector';
import { formatCentsToBRL } from '@/utils/currency';
import { DynamicIcon } from '@/utils/icons';

export default function ReportsScreen() {
  const theme = useAppTheme();
  const { selectedMonth, setSelectedMonth } = useUIStore();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/more');
    }
  };

  const { data: summary, isLoading: loadingSummary } =
    useMonthlySummary(selectedMonth);
  const { data: categorySlices = [], isLoading: loadingSlices } =
    useExpensesByCategory(selectedMonth);
  const { data: cashflow = [], isLoading: loadingCashflow } =
    useLastSixMonthsCashflow(selectedMonth);

  const pieData = useMemo(
    () =>
      categorySlices.map((slice) => ({
        value: slice.total_cents / 100,
        color: slice.category_color,
        text: `${Math.round(slice.percentage)}%`,
      })),
    [categorySlices]
  );

  const barData = useMemo(() => {
    const items: any[] = [];
    for (const point of cashflow) {
      items.push({
        value: Math.round(point.income_cents / 100),
        label: point.label,
        spacing: 4,
        labelWidth: 36,
        labelTextStyle: {
          color: theme.colors.textSecondary,
          fontSize: 11,
          fontFamily: theme.fontFamilies.bold,
        },
        frontColor: theme.colors.income,
      });
      items.push({
        value: Math.round(point.expense_cents / 100),
        frontColor: theme.colors.expense,
      });
    }
    return items;
  }, [cashflow, theme]);

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Voltar para Mais"
            style={[
              styles.backBtn,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <ArrowLeft size={20} color={theme.colors.textPrimary} />
          </Pressable>
          <Text
            style={[theme.typography.h1, { color: theme.colors.textPrimary }]}
          >
            Relatórios
          </Text>
        </View>

        <MonthSelector
          selectedMonth={selectedMonth}
          onChangeMonth={setSelectedMonth}
        />

        {loadingSummary || !summary ? (
          <ClayLoadingState message="Calculando resumo mensal..." />
        ) : (
          <>
            <ClayCard variant="primary" radius="xl" style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <Wallet size={20} color="#E6DEFF" />
                <Text
                  style={[
                    theme.typography.bodySmall,
                    { color: '#E6DEFF', marginLeft: 8 },
                  ]}
                >
                  Saldo Disponível em Conta
                </Text>
              </View>
              <Text
                style={[
                  theme.typography.hero,
                  { color: '#FFFFFF', marginTop: 4 },
                ]}
              >
                {formatCentsToBRL(summary.available_account_cents)}
              </Text>
              <View style={styles.subBalanceRow}>
                <Text style={[theme.typography.caption, { color: '#E6DEFF' }]}>
                  Saldo líquido do mês: {formatCentsToBRL(summary.balance_cents)}
                </Text>
                <View style={styles.savedInline}>
                  <PiggyBank size={13} color="#E6DEFF" />
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: '#E6DEFF', marginLeft: 4 },
                    ]}
                  >
                    Nos cofrinhos:{' '}
                    {formatCentsToBRL(summary.total_saved_in_goals_cents)}
                  </Text>
                </View>
              </View>
            </ClayCard>

            <View style={styles.gridRow}>
              <ClayCard variant="income" radius="xl" style={styles.halfCard}>
                <View style={styles.miniHeader}>
                  <ArrowUpCircle size={18} color={theme.colors.incomeDark} />
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: theme.colors.incomeDark, marginLeft: 6 },
                    ]}
                  >
                    Receitas
                  </Text>
                </View>
                <Text
                  style={[
                    theme.typography.h3,
                    {
                      color: theme.colors.incomeDark,
                      fontFamily: theme.fontFamilies.extraBold,
                      marginTop: 6,
                    },
                  ]}
                >
                  {formatCentsToBRL(summary.total_income_cents)}
                </Text>
              </ClayCard>

              <ClayCard variant="expense" radius="xl" style={styles.halfCard}>
                <View style={styles.miniHeader}>
                  <ArrowDownCircle size={18} color={theme.colors.expenseDark} />
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: theme.colors.expenseDark, marginLeft: 6 },
                    ]}
                  >
                    Despesas
                  </Text>
                </View>
                <Text
                  style={[
                    theme.typography.h3,
                    {
                      color: theme.colors.expenseDark,
                      fontFamily: theme.fontFamilies.extraBold,
                      marginTop: 6,
                    },
                  ]}
                >
                  {formatCentsToBRL(summary.total_expense_cents)}
                </Text>
              </ClayCard>
            </View>

            {summary.top_expense_category ? (
              <ClayCard radius="xl" style={styles.topCatCard}>
                <View style={styles.topCatRow}>
                  <View
                    style={[
                      styles.topCatIcon,
                      {
                        backgroundColor: `${summary.top_expense_category.category_color}24`,
                      },
                    ]}
                  >
                    <Flame
                      size={22}
                      color={summary.top_expense_category.category_color}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        theme.typography.caption,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Maior Categoria de Gasto
                    </Text>
                    <Text
                      style={[
                        theme.typography.h3,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      {summary.top_expense_category.category_name}
                    </Text>
                  </View>
                  <Text
                    style={[
                      theme.typography.h3,
                      {
                        color: theme.colors.expenseDark,
                        fontFamily: theme.fontFamilies.extraBold,
                      },
                    ]}
                  >
                    {formatCentsToBRL(summary.top_expense_category.total_cents)}
                  </Text>
                </View>
              </ClayCard>
            ) : null}
          </>
        )}

        <ClayCard radius="xl" style={styles.chartCard}>
          <Text
            style={[
              theme.typography.h3,
              { color: theme.colors.textPrimary, marginBottom: 14 },
            ]}
          >
            Despesas por Categoria
          </Text>

          {loadingSlices ? (
            <ClayLoadingState />
          ) : categorySlices.length === 0 ? (
            <ClayEmptyState
              icon={<BarChart3 size={24} color={theme.colors.primary} />}
              title="Sem despesas no mês"
              description="Registre despesas para visualizar a distribuição por categoria."
            />
          ) : (
            <>
              <View style={styles.donutWrapper}>
                <PieChart
                  donut
                  radius={92}
                  innerRadius={58}
                  innerCircleColor={theme.colors.surface}
                  data={pieData}
                  centerLabelComponent={() => (
                    <View style={styles.donutCenter}>
                      <Text
                        style={[
                          theme.typography.caption,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Total
                      </Text>
                      <Text
                        style={[
                          theme.typography.bodySmall,
                          {
                            color: theme.colors.textPrimary,
                            fontFamily: theme.fontFamilies.extraBold,
                          },
                        ]}
                      >
                        {formatCentsToBRL(summary?.total_expense_cents ?? 0)}
                      </Text>
                    </View>
                  )}
                />
              </View>

              <View style={styles.legendList}>
                {categorySlices.map((slice) => (
                  <View key={slice.category_id} style={styles.legendRow}>
                    <View style={styles.legendLeft}>
                      <View
                        style={[
                          styles.legendDot,
                          { backgroundColor: slice.category_color },
                        ]}
                      />
                      <DynamicIcon
                        name={slice.category_icon}
                        size={16}
                        color={slice.category_color}
                      />
                      <Text
                        style={[
                          theme.typography.body,
                          {
                            color: theme.colors.textPrimary,
                            marginLeft: 8,
                          },
                        ]}
                      >
                        {slice.category_name}
                      </Text>
                    </View>
                    <View style={styles.legendRight}>
                      <Text
                        style={[
                          theme.typography.bodySmall,
                          {
                            color: theme.colors.textPrimary,
                            fontFamily: theme.fontFamilies.bold,
                          },
                        ]}
                      >
                        {formatCentsToBRL(slice.total_cents)}
                      </Text>
                      <Text
                        style={[
                          theme.typography.caption,
                          {
                            color: theme.colors.textSecondary,
                            marginLeft: 8,
                            minWidth: 42,
                            textAlign: 'right',
                          },
                        ]}
                      >
                        {slice.percentage}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </ClayCard>

        <ClayCard radius="xl" style={styles.chartCard}>
          <Text
            style={[
              theme.typography.h3,
              { color: theme.colors.textPrimary, marginBottom: 6 },
            ]}
          >
            Receitas vs. Despesas (6 meses)
          </Text>
          <View style={styles.barLegendRow}>
            <View style={styles.barLegendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: theme.colors.income },
                ]}
              />
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Receitas (R$)
              </Text>
            </View>
            <View style={styles.barLegendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: theme.colors.expense },
                ]}
              />
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Despesas (R$)
              </Text>
            </View>
          </View>

          {loadingCashflow ? (
            <ClayLoadingState />
          ) : (
            <View style={styles.barChartContainer}>
              <BarChart
                data={barData}
                barWidth={14}
                spacing={20}
                roundedTop
                roundedBottom
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{
                  color: theme.colors.textMuted,
                  fontSize: 10,
                }}
                noOfSections={4}
                height={180}
                isAnimated
              />
            </View>
          )}
        </ClayCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 110,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCard: {
    marginBottom: 12,
  },
  subBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  savedInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  halfCard: {
    flex: 1,
  },
  miniHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topCatCard: {
    marginBottom: 14,
  },
  topCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topCatIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chartCard: {
    marginBottom: 16,
  },
  donutWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  donutCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendList: {
    marginTop: 12,
    gap: 10,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  legendRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  barLegendRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  barLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barChartContainer: {
    paddingTop: 8,
    overflow: 'hidden',
  },
});
