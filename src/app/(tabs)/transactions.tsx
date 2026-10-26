import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Search, Receipt, X } from 'lucide-react-native';
import { useAppTheme } from '@/theme';
import { useCategories, useTransactions } from '@/hooks';
import { useUIStore } from '@/store/useUIStore';
import {
  ClayChip,
  ClayEmptyState,
  ClayInput,
  ClayLoadingState,
} from '@/components/ui';
import { MonthSelector } from '@/components/MonthSelector';
import { TransactionRow } from '@/components/TransactionRow';
import { formatDaySectionHeader } from '@/utils/date';
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

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text
            style={[theme.typography.h1, { color: theme.colors.textPrimary }]}
          >
            Transações
          </Text>
        </View>

        <MonthSelector
          selectedMonth={selectedMonth}
          onChangeMonth={setSelectedMonth}
        />

        <ClayInput
          placeholder="Buscar por descrição ou categoria..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={18} color={theme.colors.textSecondary} />}
          rightElement={
            searchQuery ? (
              <Pressable
                onPress={() => setSearchQuery('')}
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
            sections={sections}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
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
              />
            )}
          />
        )}

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
            },
          ]}
        >
          <Plus size={28} color="#FFFFFF" strokeWidth={2.8} />
        </Pressable>
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
