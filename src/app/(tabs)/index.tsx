import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowDownCircle,
  ArrowRight,
  ArrowUpCircle,
  PiggyBank,
  Plus,
  Sparkles,
  Wallet,
} from 'lucide-react-native';
import { useAppTheme } from '@/theme';
import {
  useBudgets,
  useGoals,
  useMonthlySummary,
  useOnboardingStatus,
  useTransactions,
} from '@/hooks';
import { useUIStore } from '@/store/useUIStore';
import {
  ClayButton,
  ClayCard,
  ClayEmptyState,
  ClayProgressBar,
} from '@/components/ui';
import { MonthSelector } from '@/components/MonthSelector';
import { TransactionRow } from '@/components/TransactionRow';
import { formatCentsToBRL } from '@/utils/currency';
import { calculateBudgetProgress, calculateGoalProgress } from '@/utils/progress';
import { DynamicIcon } from '@/utils/icons';

export default function HomeScreen() {
  const theme = useAppTheme();
  const { selectedMonth, setSelectedMonth } = useUIStore();

  const { data: onboardingDone, isLoading: checkingOnboarding } =
    useOnboardingStatus();

  useEffect(() => {
    if (!checkingOnboarding && onboardingDone === false) {
      router.replace('/onboarding');
    }
  }, [checkingOnboarding, onboardingDone]);

  const { data: summary } = useMonthlySummary(selectedMonth);
  const { data: budgets = [] } = useBudgets(selectedMonth);
  const { data: recentTransactions = [] } = useTransactions({
    month: selectedMonth,
    limit: 5,
  });
  const { data: goals = [] } = useGoals();

  const totalBudgetLimit = budgets.reduce((acc, b) => acc + b.limit_cents, 0);
  const totalBudgetSpent = budgets.reduce((acc, b) => acc + b.spent_cents, 0);
  const budgetProgress = calculateBudgetProgress(
    totalBudgetSpent,
    totalBudgetLimit
  );

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topHeader}>
          <View>
            <View style={styles.brandBadge}>
              <Sparkles size={14} color={theme.colors.primary} />
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.primary, marginLeft: 4 },
                ]}
              >
                Clayfin • 100% Local
              </Text>
            </View>
            <Text
              style={[theme.typography.h1, { color: theme.colors.textPrimary }]}
            >
              Visão Geral
            </Text>
          </View>

          <ClayButton
            title="Nova"
            size="sm"
            icon={<Plus size={16} color="#FFFFFF" />}
            onPress={() => router.push('/transaction-form')}
          />
        </View>

        <MonthSelector
          selectedMonth={selectedMonth}
          onChangeMonth={setSelectedMonth}
        />

        {/* Card de Saldo Principal */}
        <ClayCard variant="primary" radius="xxl" style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.walletLabelRow}>
              <Wallet size={18} color="#E6DEFF" />
              <Text
                style={[
                  theme.typography.bodySmall,
                  { color: '#E6DEFF', marginLeft: 8 },
                ]}
              >
                Saldo do Mês
              </Text>
            </View>
          </View>

          <Text
            style={[theme.typography.hero, { color: '#FFFFFF', marginTop: 4 }]}
          >
            {formatCentsToBRL(summary?.balance_cents ?? 0)}
          </Text>

          <View style={styles.quickActionRow}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/transaction-form',
                  params: { initialType: 'income' },
                })
              }
              accessibilityRole="button"
              accessibilityLabel="Adicionar receita"
              style={styles.quickPill}
            >
              <ArrowUpCircle size={18} color="#B8F7D8" />
              <View style={{ marginLeft: 8 }}>
                <Text style={[theme.typography.caption, { color: '#E6DEFF' }]}>
                  Receitas
                </Text>
                <Text
                  style={[
                    theme.typography.bodySmall,
                    {
                      color: '#FFFFFF',
                      fontFamily: theme.fontFamilies.extraBold,
                    },
                  ]}
                >
                  {formatCentsToBRL(summary?.total_income_cents ?? 0)}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/transaction-form',
                  params: { initialType: 'expense' },
                })
              }
              accessibilityRole="button"
              accessibilityLabel="Adicionar despesa"
              style={styles.quickPill}
            >
              <ArrowDownCircle size={18} color="#FFC6C2" />
              <View style={{ marginLeft: 8 }}>
                <Text style={[theme.typography.caption, { color: '#E6DEFF' }]}>
                  Despesas
                </Text>
                <Text
                  style={[
                    theme.typography.bodySmall,
                    {
                      color: '#FFFFFF',
                      fontFamily: theme.fontFamilies.extraBold,
                    },
                  ]}
                >
                  {formatCentsToBRL(summary?.total_expense_cents ?? 0)}
                </Text>
              </View>
            </Pressable>
          </View>
        </ClayCard>

        {/* Orçamento em Andamento */}
        <View style={styles.sectionHeader}>
          <Text
            style={[theme.typography.h3, { color: theme.colors.textPrimary }]}
          >
            Orçamento em Andamento
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/budgets')}
            accessibilityRole="button"
            style={styles.seeAllBtn}
          >
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.primary },
              ]}
            >
              Ver todos
            </Text>
            <ArrowRight
              size={14}
              color={theme.colors.primary}
              style={{ marginLeft: 4 }}
            />
          </Pressable>
        </View>

        {budgets.length === 0 ? (
          <ClayCard
            variant="subtle"
            radius="xl"
            onPress={() => router.push('/(tabs)/budgets')}
            style={{ marginBottom: 18 }}
          >
            <Text
              style={[
                theme.typography.body,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.fontFamilies.bold,
                },
              ]}
            >
              Nenhum limite definido neste mês
            </Text>
            <Text
              style={[
                theme.typography.bodySmall,
                { color: theme.colors.textSecondary, marginTop: 2 },
              ]}
            >
              Toque aqui para planejar seus gastos por categoria.
            </Text>
          </ClayCard>
        ) : (
          <ClayCard
            radius="xl"
            onPress={() => router.push('/(tabs)/budgets')}
            style={{ marginBottom: 18 }}
          >
            <View style={styles.budgetRowTop}>
              <Text
                style={[
                  theme.typography.body,
                  {
                    color: theme.colors.textPrimary,
                    fontFamily: theme.fontFamilies.bold,
                  },
                ]}
              >
                {formatCentsToBRL(totalBudgetSpent)} gastos
              </Text>
              <Text
                style={[
                  theme.typography.bodySmall,
                  { color: theme.colors.textSecondary },
                ]}
              >
                de {formatCentsToBRL(totalBudgetLimit)} ({budgetProgress.percentage}
                %)
              </Text>
            </View>
            <ClayProgressBar
              percentage={budgetProgress.percentage}
              alertLevel={budgetProgress.alertLevel}
              style={{ marginTop: 10 }}
            />
          </ClayCard>
        )}

        {/* Atalho para Metas / Cofrinhos */}
        <View style={styles.sectionHeader}>
          <Text
            style={[theme.typography.h3, { color: theme.colors.textPrimary }]}
          >
            Meus Cofrinhos
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/goals')}
            accessibilityRole="button"
            style={styles.seeAllBtn}
          >
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.primary },
              ]}
            >
              Gerenciar
            </Text>
            <ArrowRight
              size={14}
              color={theme.colors.primary}
              style={{ marginLeft: 4 }}
            />
          </Pressable>
        </View>

        {goals.length === 0 ? (
          <ClayCard
            variant="subtle"
            radius="xl"
            onPress={() => router.push('/goal-form')}
            style={{ marginBottom: 18 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={[
                  styles.goalMiniIcon,
                  { backgroundColor: theme.colors.primaryLight },
                ]}
              >
                <PiggyBank size={20} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    theme.typography.body,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.fontFamilies.bold,
                    },
                  ]}
                >
                  Criar primeiro cofrinho
                </Text>
                <Text
                  style={[
                    theme.typography.bodySmall,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Guarde dinheiro para seus objetivos
                </Text>
              </View>
            </View>
          </ClayCard>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.goalsHorizontal}
          >
            {goals.slice(0, 4).map((goal) => {
              const prog = calculateGoalProgress(
                goal.current_cents,
                goal.target_cents
              );
              return (
                <ClayCard
                  key={goal.id}
                  radius="xl"
                  onPress={() =>
                    router.push({
                      pathname: '/goal-detail',
                      params: { id: goal.id },
                    })
                  }
                  style={styles.goalShortcutCard}
                >
                  <View style={styles.goalShortcutHeader}>
                    <View
                      style={[
                        styles.goalMiniIcon,
                        { backgroundColor: theme.colors.primaryLight },
                      ]}
                    >
                      <DynamicIcon
                        name={goal.icon}
                        size={18}
                        color={theme.colors.primary}
                      />
                    </View>
                    <Text
                      style={[
                        theme.typography.caption,
                        { color: theme.colors.primaryDark },
                      ]}
                    >
                      {prog.percentage}%
                    </Text>
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[
                      theme.typography.h3,
                      { color: theme.colors.textPrimary, marginTop: 6 },
                    ]}
                  >
                    {goal.name}
                  </Text>
                  <Text
                    style={[
                      theme.typography.bodySmall,
                      {
                        color: theme.colors.textSecondary,
                        marginBottom: 8,
                      },
                    ]}
                  >
                    {formatCentsToBRL(prog.currentCents)}
                  </Text>
                  <ClayProgressBar percentage={prog.percentage} height={10} />
                </ClayCard>
              );
            })}
          </ScrollView>
        )}

        {/* Últimas Transações */}
        <View style={styles.sectionHeader}>
          <Text
            style={[theme.typography.h3, { color: theme.colors.textPrimary }]}
          >
            Últimas Transações
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/transactions')}
            accessibilityRole="button"
            style={styles.seeAllBtn}
          >
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.primary },
              ]}
            >
              Ver histórico
            </Text>
            <ArrowRight
              size={14}
              color={theme.colors.primary}
              style={{ marginLeft: 4 }}
            />
          </Pressable>
        </View>

        {recentTransactions.length === 0 ? (
          <ClayEmptyState
            title="Sem movimentações neste mês"
            description="Registre suas receitas e despesas para acompanhar seu saldo em tempo real."
            actionLabel="Registrar Transação"
            onAction={() => router.push('/transaction-form')}
          />
        ) : (
          recentTransactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              transaction={tx}
              onPress={() =>
                router.push({
                  pathname: '/transaction-form',
                  params: { id: tx.id },
                })
              }
            />
          ))
        )}
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 14,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  heroCard: {
    marginBottom: 20,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  quickPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
  },
  budgetRowTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  goalsHorizontal: {
    gap: 12,
    paddingBottom: 18,
  },
  goalShortcutCard: {
    width: 195,
  },
  goalShortcutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalMiniIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
});
