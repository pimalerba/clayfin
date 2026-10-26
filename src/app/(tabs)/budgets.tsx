import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useScrollToTop } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PieChart as GiftedPieChart } from 'react-native-gifted-charts';
import {
  AlertTriangle,
  CheckCircle2,
  PieChart,
  Plus,
  Trash2,
} from 'lucide-react-native';
import { useAppTheme } from '@/theme';
import {
  useBudgets,
  useCategories,
  useDeleteBudget,
  useUpsertBudget,
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
  ClayModal,
  ClayProgressBar,
} from '@/components/ui';
import { MonthSelector } from '@/components/MonthSelector';
import { BudgetFormData, budgetFormSchema } from '@/features/schemas';
import { formatCentsToBRL } from '@/utils/currency';
import {
  hapticBudgetExceeded,
  hapticTransactionSaved,
} from '@/utils/haptics';
import { calculateBudgetProgress } from '@/utils/progress';
import { DynamicIcon } from '@/utils/icons';
import { BudgetWithUsage } from '@/types';

export default function BudgetsScreen() {
  const theme = useAppTheme();
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  useScrollToTop(scrollRef as any);
  const { selectedMonth, setSelectedMonth } = useUIStore();
  const { isRegular, maxContentWidth, columnGap } = useWindowClass();
  const [modalVisible, setModalVisible] = useState(false);

  const { data: budgets = [], isLoading } = useBudgets(selectedMonth);
  const { data: expenseCategories = [] } = useCategories('expense');
  const upsertMutation = useUpsertBudget();
  const deleteMutation = useDeleteBudget();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      category_id: '',
      limit_cents: 0,
    },
  });

  const selectedCategoryId = watch('category_id');

  const openModalForNew = () => {
    const firstCat = expenseCategories[0]?.id ?? '';
    const existingForFirst = budgets.find((b) => b.category_id === firstCat);
    reset({
      category_id: firstCat,
      limit_cents: existingForFirst?.limit_cents ?? 0,
    });
    setModalVisible(true);
  };

  const openModalForEdit = (budget: BudgetWithUsage) => {
    reset({
      category_id: budget.category_id,
      limit_cents: budget.limit_cents,
    });
    setModalVisible(true);
  };

  const onSubmit = async (values: BudgetFormData) => {
    const existingBudget = budgets.find(
      (b) => b.category_id === values.category_id
    );
    const isExceeded =
      existingBudget != null &&
      values.limit_cents > 0 &&
      existingBudget.spent_cents >= values.limit_cents;

    await upsertMutation.mutateAsync({
      category_id: values.category_id,
      month: selectedMonth,
      limit_cents: values.limit_cents,
    });

    if (isExceeded) {
      hapticBudgetExceeded();
    } else {
      hapticTransactionSaved();
    }

    setModalVisible(false);
  };

  const handleDelete = (budget: BudgetWithUsage) => {
    Alert.alert(
      'Remover limite',
      `Deseja remover o orçamento de "${budget.category_name}" neste mês?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(budget.id),
        },
      ]
    );
  };

  const totalLimitCents = budgets.reduce((acc, b) => acc + b.limit_cents, 0);
  const totalSpentCents = budgets.reduce((acc, b) => acc + b.spent_cents, 0);
  const totalProgress = calculateBudgetProgress(
    totalSpentCents,
    totalLimitCents
  );

  const budgetPieData = useMemo(
    () =>
      budgets.map((item) => ({
        value: Math.max(1, Math.round(item.limit_cents / 100)),
        color: item.category_color,
      })),
    [budgets]
  );

  const overviewCardElement = (
    <ClayCard
      variant="primary"
      radius="xl"
      style={[
        styles.overviewCard,
        isRegular ? { flex: 1, marginBottom: 0 } : null,
      ]}
    >
      <Text style={[theme.typography.bodySmall, { color: '#EDE7FF' }]}>
        Total Orçado no Mês
      </Text>
      <View style={styles.overviewAmounts}>
        <Text
          maxFontSizeMultiplier={1.3}
          style={[theme.typography.h1, { color: '#FFFFFF' }]}
        >
          {formatCentsToBRL(totalSpentCents)}
        </Text>
        <Text style={[theme.typography.body, { color: '#E2D9FF' }]}>
          de {formatCentsToBRL(totalLimitCents)}
        </Text>
      </View>
      <ClayProgressBar
        percentage={totalProgress.percentage}
        alertLevel={totalProgress.alertLevel}
        height={14}
        style={{ marginTop: 10 }}
      />
      <Text
        style={[theme.typography.caption, { color: '#F3EEFF', marginTop: 8 }]}
      >
        {totalProgress.isOver100
          ? 'Limite total excedido!'
          : `${totalProgress.percentage}% utilizado • Restam ${formatCentsToBRL(
              Math.max(0, totalProgress.remainingCents)
            )}`}
      </Text>
    </ClayCard>
  );

  const renderBudgetCard = (item: BudgetWithUsage) => {
    const progress = calculateBudgetProgress(
      item.spent_cents,
      item.limit_cents
    );

    return (
      <ClayCard
        key={item.id}
        radius="xl"
        onPress={() => openModalForEdit(item)}
        style={[
          styles.budgetCard,
          isRegular ? styles.budgetCardRegular : null,
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.categoryInfo}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${item.category_color}24` },
              ]}
            >
              <DynamicIcon
                name={item.category_icon}
                size={20}
                color={item.category_color}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  theme.typography.h3,
                  { color: theme.colors.textPrimary },
                ]}
              >
                {item.category_name}
              </Text>
              <Text
                style={[
                  theme.typography.bodySmall,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {formatCentsToBRL(item.spent_cents)} de{' '}
                {formatCentsToBRL(item.limit_cents)}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => handleDelete(item)}
            accessibilityRole="button"
            accessibilityLabel={`Remover orçamento de ${item.category_name}`}
            style={styles.trashBtn}
          >
            <Trash2 size={18} color={theme.colors.textMuted} />
          </Pressable>
        </View>

        <ClayProgressBar
          percentage={progress.percentage}
          alertLevel={progress.alertLevel}
          customColor={item.category_color}
          style={{ marginVertical: 12 }}
        />

        <View style={styles.statusRow}>
          {progress.isOver100 ? (
            <View
              style={[
                styles.alertBadge,
                { backgroundColor: theme.colors.expenseLight },
              ]}
            >
              <AlertTriangle size={14} color={theme.colors.expenseDark} />
              <Text
                style={[
                  theme.typography.caption,
                  {
                    color: theme.colors.expenseDark,
                    marginLeft: 6,
                    flexShrink: 1,
                  },
                ]}
              >
                Limite excedido em{' '}
                {formatCentsToBRL(Math.abs(progress.remainingCents))} (
                {progress.percentage}%)
              </Text>
            </View>
          ) : progress.isOver80 ? (
            <View
              style={[
                styles.alertBadge,
                { backgroundColor: theme.colors.warningLight },
              ]}
            >
              <AlertTriangle size={14} color={theme.colors.warningDark} />
              <Text
                style={[
                  theme.typography.caption,
                  {
                    color: theme.colors.warningDark,
                    marginLeft: 6,
                    flexShrink: 1,
                  },
                ]}
              >
                Atenção: {progress.percentage}% do limite atingido!
              </Text>
            </View>
          ) : (
            <View style={styles.normalBadge}>
              <CheckCircle2 size={14} color={theme.colors.incomeDark} />
              <Text
                style={[
                  theme.typography.caption,
                  {
                    color: theme.colors.textSecondary,
                    marginLeft: 6,
                    flexShrink: 1,
                  },
                ]}
              >
                {progress.percentage}% utilizado • Disponível:{' '}
                {formatCentsToBRL(progress.remainingCents)}
              </Text>
            </View>
          )}
        </View>
      </ClayCard>
    );
  };

  return (
    <SafeAreaView
      edges={Platform.OS === 'ios' ? ['top', 'left', 'right'] : ['top']}
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.contentWrapper,
            maxContentWidth
              ? { maxWidth: maxContentWidth, alignSelf: 'center' }
              : null,
          ]}
        >
          <View style={styles.headerRow}>
            <Text
              accessibilityRole="header"
              style={[theme.typography.h1, { color: theme.colors.textPrimary }]}
            >
              Orçamento Mensal
            </Text>
            <ClayButton
              title="Definir Limite"
              size="sm"
              icon={<Plus size={16} color="#FFFFFF" />}
              onPress={openModalForNew}
            />
          </View>

          <MonthSelector
            selectedMonth={selectedMonth}
            onChangeMonth={setSelectedMonth}
          />

          {budgets.length > 0 ? (
            isRegular ? (
              <View style={[styles.regularSummaryRow, { gap: columnGap }]}>
                {overviewCardElement}
                <ClayCard radius="xl" style={styles.regularChartCard}>
                  <Text
                    style={[
                      theme.typography.h3,
                      { color: theme.colors.textPrimary, marginBottom: 10 },
                    ]}
                  >
                    Distribuição por Categoria
                  </Text>
                  <View style={styles.regularChartInner}>
                    <GiftedPieChart
                      donut
                      radius={58}
                      innerRadius={36}
                      innerCircleColor={theme.colors.surface}
                      data={budgetPieData}
                      centerLabelComponent={() => (
                        <Text
                          style={[
                            theme.typography.caption,
                            {
                              color: theme.colors.textPrimary,
                              fontFamily: theme.fontFamilies.extraBold,
                            },
                          ]}
                        >
                          {totalProgress.percentage}%
                        </Text>
                      )}
                    />
                    <View style={styles.regularLegendCol}>
                      {budgets.slice(0, 4).map((b) => (
                        <View key={b.id} style={styles.regularLegendItem}>
                          <View
                            style={[
                              styles.legendDot,
                              { backgroundColor: b.category_color },
                            ]}
                          />
                          <Text
                            numberOfLines={1}
                            style={[
                              theme.typography.caption,
                              { color: theme.colors.textPrimary, flex: 1 },
                            ]}
                          >
                            {b.category_name}
                          </Text>
                          <Text
                            style={[
                              theme.typography.caption,
                              {
                                color: theme.colors.textSecondary,
                                marginLeft: 6,
                              },
                            ]}
                          >
                            {formatCentsToBRL(b.limit_cents)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </ClayCard>
              </View>
            ) : (
              overviewCardElement
            )
          ) : null}

          {isLoading ? (
            <ClayLoadingState message="Carregando limites..." />
          ) : budgets.length === 0 ? (
            <ClayEmptyState
              icon={<PieChart size={28} color={theme.colors.primary} />}
              title="Nenhum orçamento definido"
              description="Defina limites de gastos por categoria para receber alertas quando atingir 80% ou 100%."
              actionLabel="Definir Primeiro Limite"
              onAction={openModalForNew}
            />
          ) : isRegular ? (
            <View style={[styles.regularGrid, { gap: columnGap }]}>
              {budgets.map(renderBudgetCard)}
            </View>
          ) : (
            budgets.map(renderBudgetCard)
          )}
        </View>
      </ScrollView>

      <ClayModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Limite de Gasto"
        subtitle="Escolha a categoria e o valor máximo para o mês selecionado"
      >
        <Text
          style={[
            theme.typography.bodySmall,
            styles.modalLabel,
            { color: theme.colors.textSecondary },
          ]}
        >
          Categoria de Despesa
        </Text>
        <View style={styles.chipsWrap}>
          {expenseCategories.map((cat) => {
            const selected = selectedCategoryId === cat.id;
            return (
              <ClayChip
                key={cat.id}
                label={cat.name}
                selected={selected}
                accentColor={cat.color}
                icon={
                  <DynamicIcon
                    name={cat.icon}
                    size={16}
                    color={selected ? '#FFFFFF' : cat.color}
                  />
                }
                onPress={() => {
                  setValue('category_id', cat.id, { shouldValidate: true });
                  const existing = budgets.find(
                    (b) => b.category_id === cat.id
                  );
                  if (existing) {
                    setValue('limit_cents', existing.limit_cents);
                  }
                }}
              />
            );
          })}
        </View>
        {errors.category_id ? (
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.expenseDark, marginBottom: 8 },
            ]}
          >
            {errors.category_id.message}
          </Text>
        ) : null}

        <Controller
          control={control}
          name="limit_cents"
          render={({ field: { value, onChange } }) => (
            <ClayInput
              label="Limite Mensal (R$)"
              isCurrency
              valueCents={value}
              onChangeCents={onChange}
              errorMessage={errors.limit_cents?.message}
            />
          )}
        />

        <ClayButton
          title="Salvar Orçamento"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          size="lg"
          style={{ marginTop: 8 }}
        />
      </ClayModal>
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
  contentWrapper: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 8,
  },
  regularSummaryRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 18,
  },
  regularChartCard: {
    flex: 1,
    justifyContent: 'center',
  },
  regularChartInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  regularLegendCol: {
    flex: 1,
    gap: 6,
  },
  regularLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  regularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
  },
  overviewCard: {
    marginBottom: 18,
  },
  overviewAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  budgetCard: {
    marginBottom: 14,
  },
  budgetCardRegular: {
    flexBasis: '47%',
    flexGrow: 1,
    marginBottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  trashBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flex: 1,
  },
  normalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalLabel: {
    marginBottom: 8,
    fontWeight: '600',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
});
