import React, { useMemo, useRef } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useScrollToTop } from 'expo-router';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Plus,
  Receipt,
  Search,
  Wallet,
  X,
} from 'lucide-react-native';
import { useAppTheme } from '@/theme';
import {
  useCategories,
  useDeleteTransaction,
  useLiquidGlass,
  useTransactions,
  useWindowClass,
} from '@/hooks';
import { useUIStore } from '@/store/useUIStore';
import {
  ClayButton,
  ClayCard,
  ClayChip,
  ClayEmptyState,
  ClayInput,
  ClayLoadingState,
  GlassContainer,
  GlassSurface,
} from '@/components/ui';
import { MonthSelector } from '@/components/MonthSelector';
import { TransactionRow } from '@/components/TransactionRow';
import { formatDaySectionHeader, formatMonthYearPtBR } from '@/utils/date';
import { formatCentsToBRL } from '@/utils/currency';
import { DynamicIcon } from '@/utils/icons';
import { TransactionWithCategory } from '@/types';

interface DaySection {
  title: string;
  date: string;
  totalDayCents: number;
  data: TransactionWithCategory[];
}

export default function TransactionsScreen() {
  const theme = useAppTheme();
  const isLiquidGlass = useLiquidGlass();
  const { isRegular, maxContentWidth, columnGap } = useWindowClass();
  const insets = useSafeAreaInsets();
  const sectionListRef = useRef<SectionList<TransactionWithCategory, DaySection>>(null);
  useScrollToTop(sectionListRef as any);
  const {
    selectedMonth,
    setSelectedMonth,
    filterType,
    setFilterType,
    filterCategoryId,
    setFilterCategoryId,
    searchQuery,
    setSearchQuery,
  } = useUIStore();

  const { data: categories = [] } = useCategories(
    filterType === 'all' ? undefined : filterType
  );
  const deleteTransactionMutation = useDeleteTransaction();

  const {
    data: transactions = [],
    isLoading,
    isError,
  } = useTransactions({
    month: selectedMonth,
    type: filterType === 'all' ? undefined : filterType,
    categoryId: filterCategoryId,
    search: searchQuery,
  });

  const sections = useMemo<DaySection[]>(() => {
    const grouped = new Map<string, TransactionWithCategory[]>();
    for (const tx of transactions) {
      const list = grouped.get(tx.date) ?? [];
      list.push(tx);
      grouped.set(tx.date, list);
    }

    return Array.from(grouped.entries()).map(([date, items]) => {
      const totalDayCents = items.reduce(
        (acc, item) =>
          item.type === 'income'
            ? acc + item.amount_cents
            : acc - item.amount_cents,
        0
      );
      return {
        date,
        title: formatDaySectionHeader(date),
        totalDayCents,
        data: items,
      };
    });
  }, [transactions]);

  const monthTotals = useMemo(() => {
    let incomeCents = 0;
    let expenseCents = 0;
    for (const tx of transactions) {
      if (tx.type === 'income') {
        incomeCents += tx.amount_cents;
      } else {
        expenseCents += tx.amount_cents;
      }
    }
    return {
      incomeCents,
      expenseCents,
      netCents: incomeCents - expenseCents,
    };
  }, [transactions]);

  const filterAndListColumn = (
    <View style={styles.listColumn}>
      <ClayInput
        placeholder="Buscar por descrição ou categoria..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        leftIcon={<Search size={18} color={theme.colors.textSecondary} />}
        rightElement={
          searchQuery ? (
            <Pressable
              onPress={() => setSearchQuery('')}
              accessibilityRole="button"
              accessibilityLabel="Limpar busca"
            >
              <X size={18} color={theme.colors.textSecondary} />
            </Pressable>
          ) : undefined
        }
        containerStyle={{ marginBottom: 10 }}
      />

      <View style={styles.filterBlock}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          <ClayChip
            label="Todos"
            selected={filterType === 'all'}
            onPress={() => setFilterType('all')}
            style={styles.chip}
          />
          <ClayChip
            label="Despesas"
            selected={filterType === 'expense'}
            accentColor={theme.colors.expense}
            onPress={() => setFilterType('expense')}
            style={styles.chip}
          />
          <ClayChip
            label="Receitas"
            selected={filterType === 'income'}
            accentColor={theme.colors.income}
            onPress={() => setFilterType('income')}
            style={styles.chip}
          />
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          <ClayChip
            label="Todas categorias"
            selected={filterCategoryId === null}
            onPress={() => setFilterCategoryId(null)}
            style={styles.chip}
          />
          {categories.map((cat) => {
            const selected = filterCategoryId === cat.id;
            return (
              <ClayChip
                key={cat.id}
                label={cat.name}
                selected={selected}
                accentColor={cat.color}
                icon={
                  <DynamicIcon
                    name={cat.icon}
                    size={14}
                    color={selected ? '#FFFFFF' : cat.color}
                  />
                }
                onPress={() =>
                  setFilterCategoryId(selected ? null : cat.id)
                }
                style={styles.chip}
              />
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <ClayLoadingState message="Carregando transações..." />
      ) : isError ? (
        <ClayEmptyState
          title="Erro ao carregar"
          description="Não foi possível consultar suas transações locais."
        />
      ) : sections.length === 0 ? (
        <ClayEmptyState
          icon={<Receipt size={26} color={theme.colors.primary} />}
          title="Nenhuma transação encontrada"
          description="Adicione sua primeira receita ou despesa neste mês ou ajuste os filtros."
          actionLabel="Nova Transação"
          onAction={() => router.push('/transaction-form')}
        />
      ) : (
        <SectionList
          ref={sectionListRef}
          sections={sections}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {section.title}
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  {
                    color:
                      section.totalDayCents >= 0
                        ? theme.colors.incomeDark
                        : theme.colors.expenseDark,
                  },
                ]}
              >
                {section.totalDayCents >= 0 ? '+' : ''}
                {formatCentsToBRL(section.totalDayCents)}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TransactionRow
              transaction={item}
              onPress={() =>
                router.push({
                  pathname: '/transaction-form',
                  params: { id: item.id },
                })
              }
              onEdit={() =>
                router.push({
                  pathname: '/transaction-form',
                  params: { id: item.id },
                })
              }
              onDelete={() => deleteTransactionMutation.mutate(item.id)}
            />
          )}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView
      edges={Platform.OS === 'ios' ? ['top', 'left', 'right'] : ['top']}
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
    >
      {/*
        Escolha de integração com NativeTabs no iOS (doc Expo Router v58):
        Como a SectionList fica abaixo do cabeçalho fixo (MonthSelector, busca e chips horizontais),
        optamos por `disableTransparentOnScrollEdge` no Trigger "transactions" em `_layout.ios.tsx`
        combinado com `collapsable={false}` no container, `contentInsetAdjustmentBehavior="automatic"`
        e `useScrollToTop(sectionListRef)` para manter filtros fixos no topo e scroll-to-top ao tocar na aba ativa.
      */}
      <View
        style={[
          styles.container,
          maxContentWidth
            ? { maxWidth: maxContentWidth, width: '100%', alignSelf: 'center' }
            : null,
        ]}
        collapsable={false}
      >
        <View style={styles.headerRow}>
          <Text
            accessibilityRole="header"
            style={[theme.typography.h1, { color: theme.colors.textPrimary }]}
          >
            Transações
          </Text>
        </View>

        <MonthSelector
          selectedMonth={selectedMonth}
          onChangeMonth={setSelectedMonth}
        />

        {isRegular ? (
          <View style={[styles.regularSplitRow, { gap: columnGap }]}>
            {filterAndListColumn}

            <View style={styles.summarySidePanel}>
              <ClayCard variant="primary" radius="xl" style={styles.summaryHero}>
                <View style={styles.summaryTitleRow}>
                  <Wallet size={18} color="#E6DEFF" />
                  <Text
                    style={[
                      theme.typography.bodySmall,
                      { color: '#E6DEFF', marginLeft: 8 },
                    ]}
                  >
                    Resumo • {formatMonthYearPtBR(selectedMonth)}
                  </Text>
                </View>
                <Text
                  maxFontSizeMultiplier={1.3}
                  style={[
                    theme.typography.h1,
                    { color: '#FFFFFF', marginTop: 6 },
                  ]}
                >
                  {monthTotals.netCents >= 0 ? '+' : ''}
                  {formatCentsToBRL(monthTotals.netCents)}
                </Text>
                <Text
                  style={[
                    theme.typography.caption,
                    { color: '#E6DEFF', marginTop: 4 },
                  ]}
                >
                  {transactions.length} lançamento(s) em {sections.length} dia(s)
                </Text>
              </ClayCard>

              <ClayCard radius="xl" style={styles.summaryBreakdownCard}>
                <View style={styles.breakdownItem}>
                  <View style={styles.breakdownLeft}>
                    <ArrowUpCircle size={18} color={theme.colors.incomeDark} />
                    <Text
                      style={[
                        theme.typography.bodySmall,
                        { color: theme.colors.textSecondary, marginLeft: 8 },
                      ]}
                    >
                      Receitas filtradas
                    </Text>
                  </View>
                  <Text
                    style={[
                      theme.typography.body,
                      {
                        color: theme.colors.incomeDark,
                        fontFamily: theme.fontFamilies.extraBold,
                      },
                    ]}
                  >
                    + {formatCentsToBRL(monthTotals.incomeCents)}
                  </Text>
                </View>

                <View style={styles.breakdownDivider} />

                <View style={styles.breakdownItem}>
                  <View style={styles.breakdownLeft}>
                    <ArrowDownCircle
                      size={18}
                      color={theme.colors.expenseDark}
                    />
                    <Text
                      style={[
                        theme.typography.bodySmall,
                        { color: theme.colors.textSecondary, marginLeft: 8 },
                      ]}
                    >
                      Despesas filtradas
                    </Text>
                  </View>
                  <Text
                    style={[
                      theme.typography.body,
                      {
                        color: theme.colors.expenseDark,
                        fontFamily: theme.fontFamilies.extraBold,
                      },
                    ]}
                  >
                    - {formatCentsToBRL(monthTotals.expenseCents)}
                  </Text>
                </View>

                <ClayButton
                  title="Nova Transação"
                  size="sm"
                  icon={<Plus size={16} color="#FFFFFF" />}
                  onPress={() => router.push('/transaction-form')}
                  style={{ marginTop: 14 }}
                />
              </ClayCard>
            </View>
          </View>
        ) : (
          filterAndListColumn
        )}

        {isLiquidGlass ? (
          <GlassContainer
            spacing={12}
            style={[
              styles.fabPosition,
              { bottom: Math.max(insets.bottom + 64, 90) },
            ]}
          >
            <Pressable
              onPress={() => router.push('/transaction-form')}
              accessibilityRole="button"
              accessibilityLabel="Nova transação"
            >
              <GlassSurface
                interactive
                tintColor={theme.colors.primaryDark}
                borderRadius={theme.radii.pill}
                style={styles.fabGlass}
              >
                <Plus size={28} color="#FFFFFF" strokeWidth={2.8} />
              </GlassSurface>
            </Pressable>
          </GlassContainer>
        ) : (
          <Pressable
            onPress={() => router.push('/transaction-form')}
            accessibilityRole="button"
            accessibilityLabel="Nova transação"
            style={[
              styles.fab,
              theme.shadows.lg,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.radii.pill,
                bottom:
                  Platform.OS === 'ios' ? Math.max(insets.bottom + 64, 90) : 22,
              },
            ]}
          >
            <Plus size={28} color="#FFFFFF" strokeWidth={2.8} />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  regularSplitRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  listColumn: {
    flex: 1.4,
  },
  summarySidePanel: {
    flex: 0.95,
    maxWidth: 340,
  },
  summaryHero: {
    marginBottom: 12,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryBreakdownCard: {
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    flexWrap: 'wrap',
    gap: 6,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: 'rgba(122, 90, 248, 0.12)',
    marginVertical: 10,
  },
  filterBlock: {
    marginBottom: 6,
  },
  chipsScroll: {
    gap: 8,
    paddingBottom: 8,
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
  },
  listContent: {
    paddingBottom: 110,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  fabPosition: {
    position: 'absolute',
    right: 22,
  },
  fabGlass: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: 22,
    bottom: 22,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopColor: 'rgba(255,255,255,0.45)',
    borderLeftColor: 'rgba(255,255,255,0.45)',
    borderBottomColor: 'rgba(40,20,100,0.32)',
    borderRightColor: 'rgba(40,20,100,0.32)',
  },
});
