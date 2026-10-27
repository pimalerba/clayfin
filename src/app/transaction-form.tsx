import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  FileText,
  Repeat,
  Trash2,
  X,
} from 'lucide-react-native';
import { useAppTheme } from '@/theme';
import {
  useBudgets,
  useCategories,
  useCreateRecurringWithFirstOccurrence,
  useCreateTransaction,
  useDeleteTransaction,
  useLiquidGlass,
  useRecurringRuleDetail,
  useTransactionDetail,
  useUpdateRecurringRule,
  useUpdateTransaction,
  useWindowClass,
} from '@/hooks';
import {
  ClayButton,
  ClayCard,
  ClayChip,
  ClayInput,
  GlassContainer,
  GlassSurface,
  NativeDateField,
} from '@/components/ui';
import {
  TransactionFormData,
  transactionFormSchema,
} from '@/features/schemas';
import { getTodayISO } from '@/utils/date';
import { getWeekdayYMD, parseYMD } from '@/utils/recurring';
import {
  hapticBudgetExceeded,
  hapticTransactionSaved,
} from '@/utils/haptics';
import { DynamicIcon } from '@/utils/icons';

export default function TransactionFormScreen() {
  const theme = useAppTheme();
  const isLiquidGlass = useLiquidGlass();
  const { maxFormWidth } = useWindowClass();
  const params = useLocalSearchParams<{ id?: string; initialType?: string }>();
  const isEditing = Boolean(params.id);

  const { data: existingTx } = useTransactionDetail(params.id);
  const { data: existingRule } = useRecurringRuleDetail(
    existingTx?.recurring_rule_id ?? undefined
  );
  const { data: allCategories = [] } = useCategories();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();
  const createRecurringWithFirstOccurrence =
    useCreateRecurringWithFirstOccurrence();
  const updateRecurringRuleMutation = useUpdateRecurringRule();

  const [repeatFrequency, setRepeatFrequency] = useState<
    'never' | 'weekly' | 'monthly' | 'yearly'
  >('never');
  const [repeatEndDate, setRepeatEndDate] = useState<string>('');

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: params.initialType === 'income' ? 'income' : 'expense',
      amount_cents: 0,
      category_id: '',
      date: getTodayISO(),
      description: '',
    },
  });

  const selectedType = watch('type');
  const selectedCategoryId = watch('category_id');
  const selectedDate = watch('date');
  const txMonth = (selectedDate || getTodayISO()).slice(0, 7);
  const { data: monthBudgets = [] } = useBudgets(txMonth);

  const isMutationPending =
    isSubmitting ||
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    createRecurringWithFirstOccurrence.isPending ||
    updateRecurringRuleMutation.isPending;

  const filteredCategories = useMemo(
    () => allCategories.filter((c) => c.type === selectedType),
    [allCategories, selectedType]
  );

  useEffect(() => {
    if (existingTx) {
      reset({
        type: existingTx.type,
        amount_cents: existingTx.amount_cents,
        category_id: existingTx.category_id,
        date: existingTx.date,
        description: existingTx.description ?? '',
      });
    }
  }, [existingTx, reset]);

  useEffect(() => {
    if (!selectedCategoryId && filteredCategories.length > 0) {
      setValue('category_id', filteredCategories[0].id);
    } else if (
      selectedCategoryId &&
      filteredCategories.length > 0 &&
      !filteredCategories.some((c) => c.id === selectedCategoryId)
    ) {
      setValue('category_id', filteredCategories[0].id);
    }
  }, [filteredCategories, selectedCategoryId, setValue]);

  const executeSave = async (
    values: TransactionFormData,
    scope: 'single' | 'future' = 'single'
  ) => {
    const matchingBudget =
      values.type === 'expense'
        ? monthBudgets.find((b) => b.category_id === values.category_id)
        : undefined;
    const previousExpenseInSameBudget =
      isEditing &&
      existingTx &&
      existingTx.type === 'expense' &&
      existingTx.category_id === values.category_id &&
      existingTx.date.slice(0, 7) === values.date.slice(0, 7)
        ? existingTx.amount_cents
        : 0;
    const willExceedBudget =
      matchingBudget != null &&
      matchingBudget.limit_cents > 0 &&
      matchingBudget.spent_cents -
        previousExpenseInSameBudget +
        values.amount_cents >=
        matchingBudget.limit_cents;

    if (isEditing && params.id) {
      await updateMutation.mutateAsync({
        id: params.id,
        ...values,
      });

      if (scope === 'future' && existingTx?.recurring_rule_id && existingRule) {
        await updateRecurringRuleMutation.mutateAsync({
          id: existingRule.id,
          category_id: values.category_id,
          type: values.type,
          amount_cents: values.amount_cents,
          description: values.description?.trim() || null,
          frequency: existingRule.frequency,
          day_of_month: existingRule.day_of_month,
          weekday: existingRule.weekday,
          start_date: existingRule.start_date,
          end_date: existingRule.end_date,
          is_active: existingRule.is_active,
        });
      }
    } else {
      if (repeatFrequency === 'never') {
        await createMutation.mutateAsync(values);
      } else {
        const parsedDate = parseYMD(values.date);
        const dayOfMonth =
          repeatFrequency === 'weekly' ? null : parsedDate.day;
        const weekday =
          repeatFrequency === 'weekly' ? getWeekdayYMD(values.date) : null;

        await createRecurringWithFirstOccurrence.mutateAsync({
          input: {
            category_id: values.category_id,
            type: values.type,
            amount_cents: values.amount_cents,
            description: values.description?.trim() || null,
            frequency: repeatFrequency,
            day_of_month: dayOfMonth,
            weekday,
            start_date: values.date,
            end_date: repeatEndDate.trim() || null,
            is_active: 1,
          },
          firstOccurrenceDate: values.date,
        });
      }
    }

    if (willExceedBudget) {
      hapticBudgetExceeded();
    } else {
      hapticTransactionSaved();
    }

    router.back();
  };

  const onSubmit = async (values: TransactionFormData) => {
    try {
      if (isEditing && existingTx?.recurring_rule_id) {
        Alert.alert(
          'Transação Recorrente',
          'Esta transação faz parte de uma recorrência. Deseja aplicar as alterações a:',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Só esta',
              onPress: () => executeSave(values, 'single'),
            },
            {
              text: 'Esta e as futuras',
              onPress: () => executeSave(values, 'future'),
            },
          ]
        );
        return;
      }

      await executeSave(values, 'single');
    } catch (err: any) {
      Alert.alert(
        'Erro ao salvar',
        err?.message ?? 'Não foi possível salvar a transação.'
      );
    }
  };

  const handleDelete = () => {
    if (!params.id) return;
    Alert.alert(
      'Excluir transação',
      'Deseja realmente excluir esta transação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await deleteMutation.mutateAsync(params.id!);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      edges={
        Platform.OS === 'ios'
          ? ['bottom', 'left', 'right']
          : ['top', 'bottom', 'left', 'right']
      }
      style={[
        styles.safe,
        {
          backgroundColor: isLiquidGlass
            ? 'transparent'
            : theme.colors.background,
        },
      ]}
    >
      <View
        style={[
          styles.header,
          maxFormWidth
            ? { maxWidth: maxFormWidth, width: '100%', alignSelf: 'center' }
            : null,
          Platform.OS === 'ios' ? { paddingTop: 18 } : null,
        ]}
      >
        <Text
          style={[
            theme.typography.h1,
            { color: theme.colors.textPrimary },
          ]}
        >
          {isEditing ? 'Editar Transação' : 'Nova Transação'}
        </Text>
        {isLiquidGlass ? (
          <GlassContainer spacing={8}>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
            >
              <GlassSurface
                interactive
                tintColor={theme.isDark ? "rgba(157, 133, 242, 0.20)" : "rgba(122, 90, 248, 0.16)"}
                borderRadius={22}
                style={styles.iconBtn}
              >
                <X size={22} color={theme.colors.textPrimary} strokeWidth={2.4} />
              </GlassSurface>
            </Pressable>
          </GlassContainer>
        ) : (
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            style={[
              styles.iconBtn,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <X size={22} color={theme.colors.textPrimary} />
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          maxFormWidth
            ? { maxWidth: maxFormWidth, width: '100%', alignSelf: 'center' }
            : null,
        ]}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.typeToggleRow}>
          <ClayChip
            label="Despesa"
            selected={selectedType === 'expense'}
            accentColor={theme.colors.expense}
            icon={
              <ArrowDownCircle
                size={18}
                color={
                  selectedType === 'expense'
                    ? '#FFFFFF'
                    : theme.colors.expense
                }
              />
            }
            onPress={() => setValue('type', 'expense')}
            style={styles.typeChip}
          />
          <ClayChip
            label="Receita"
            selected={selectedType === 'income'}
            accentColor={theme.colors.income}
            icon={
              <ArrowUpCircle
                size={18}
                color={
                  selectedType === 'income'
                    ? '#FFFFFF'
                    : theme.colors.income
                }
              />
            }
            onPress={() => setValue('type', 'income')}
            style={styles.typeChip}
          />
        </View>

        <ClayCard radius="xl" style={styles.formCard}>
          <Controller
            control={control}
            name="amount_cents"
            render={({ field: { value, onChange } }) => (
              <ClayInput
                label="Valor (R$)"
                isCurrency
                valueCents={value}
                onChangeCents={onChange}
                errorMessage={errors.amount_cents?.message}
              />
            )}
          />

          <Text
            style={[
              theme.typography.bodySmall,
              styles.sectionLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Categoria
          </Text>
          <View style={styles.categoriesGrid}>
            {filteredCategories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <ClayChip
                  key={cat.id}
                  label={cat.name}
                  selected={isSelected}
                  accentColor={cat.color}
                  icon={
                    <DynamicIcon
                      name={cat.icon}
                      size={16}
                      color={isSelected ? '#FFFFFF' : cat.color}
                    />
                  }
                  onPress={() =>
                    setValue('category_id', cat.id, { shouldValidate: true })
                  }
                  style={styles.categoryChip}
                />
              );
            })}
          </View>
          {errors.category_id ? (
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.expense, marginBottom: 10 },
              ]}
            >
              {errors.category_id.message}
            </Text>
          ) : null}

          <Controller
            control={control}
            name="date"
            render={({ field: { value, onChange } }) => (
              <NativeDateField
                label={Platform.OS === 'ios' ? 'Data' : 'Data (AAAA-MM-DD)'}
                value={value}
                onChange={onChange}
                errorMessage={errors.date?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { value, onChange } }) => (
              <ClayInput
                label="Descrição (opcional)"
                placeholder="Ex.: Almoço, Supermercado..."
                value={value ?? ''}
                onChangeText={onChange}
                leftIcon={
                  <FileText size={18} color={theme.colors.textSecondary} />
                }
                errorMessage={errors.description?.message}
              />
            )}
          />

          {!isEditing ? (
            <>
              <Text
                style={[
                  theme.typography.bodySmall,
                  styles.sectionLabel,
                  { color: theme.colors.textSecondary, marginTop: 12 },
                ]}
              >
                Repetir
              </Text>
              <View style={styles.repeatToggleRow}>
                {(['never', 'weekly', 'monthly', 'yearly'] as const).map(
                  (freq) => {
                    const label =
                      freq === 'never'
                        ? 'Nunca'
                        : freq === 'weekly'
                        ? 'Semanal'
                        : freq === 'monthly'
                        ? 'Mensal'
                        : 'Anual';
                    const isSelected = repeatFrequency === freq;
                    return (
                      <ClayChip
                        key={freq}
                        label={label}
                        selected={isSelected}
                        accentColor={theme.colors.primary}
                        icon={
                          freq !== 'never' ? (
                            <Repeat
                              size={14}
                              color={
                                isSelected ? '#FFFFFF' : theme.colors.primary
                              }
                            />
                          ) : undefined
                        }
                        onPress={() => setRepeatFrequency(freq)}
                        style={styles.repeatChip}
                      />
                    );
                  }
                )}
              </View>

              {repeatFrequency !== 'never' ? (
                <View style={{ marginTop: 10 }}>
                  <NativeDateField
                    label="Repetir até (opcional)"
                    value={repeatEndDate}
                    onChange={setRepeatEndDate}
                  />
                </View>
              ) : null}
            </>
          ) : null}
        </ClayCard>

        <View style={styles.actionsBlock}>
          <ClayButton
            title={isEditing ? 'Salvar Alterações' : 'Adicionar Transação'}
            onPress={handleSubmit(onSubmit)}
            loading={
              isSubmitting ||
              createMutation.isPending ||
              updateMutation.isPending
            }
            disabled={isMutationPending}
            variant={selectedType === 'income' ? 'income' : 'primary'}
            size="lg"
          />

          {isEditing ? (
            <ClayButton
              title="Excluir Transação"
              onPress={handleDelete}
              variant="danger"
              icon={<Trash2 size={18} color="#FFFFFF" />}
              loading={deleteMutation.isPending}
              disabled={isMutationPending}
              style={{ marginTop: 12 }}
            />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeChip: {
    flex: 1,
  },
  formCard: {
    marginBottom: 20,
  },
  sectionLabel: {
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: '600',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    marginBottom: 4,
  },
  repeatToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  repeatChip: {
    flex: 1,
  },
  actionsBlock: {
    marginTop: 4,
  },
});
