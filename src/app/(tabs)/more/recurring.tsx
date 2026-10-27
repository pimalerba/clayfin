import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useScrollToTop } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowLeft,
  ArrowUpCircle,
  Calendar,
  Edit3,
  FileText,
  Pause,
  Play,
  Plus,
  Repeat,
  RotateCcw,
  Trash2,
} from 'lucide-react-native';
import { useAppTheme } from '@/theme';
import {
  useCategories,
  useCreateRecurringRule,
  useDeleteRecurringRule,
  useRecurringRules,
  useToggleRecurringRule,
  useUpdateRecurringRule,
  useWindowClass,
} from '@/hooks';
import {
  ClayButton,
  ClayCard,
  ClayChip,
  ClayEmptyState,
  ClayInput,
  ClayModal,
  NativeDateField,
} from '@/components/ui';
import {
  RecurringRuleFormData,
  recurringRuleFormSchema,
} from '@/features/schemas';
import {
  RecurringFrequency,
  RecurringRuleWithCategory,
} from '@/types';
import { formatCentsToBRL } from '@/utils/currency';
import { formatDateShortPtBR, getTodayISO } from '@/utils/date';
import { DynamicIcon } from '@/utils/icons';
import {
  getNextOccurrence,
  getWeekdayYMD,
  parseYMD,
} from '@/utils/recurring';

const WEEKDAY_NAMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export default function RecurringScreen() {
  const theme = useAppTheme();
  const { maxContentWidth, maxFormWidth } = useWindowClass();
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  useScrollToTop(scrollRef as any);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  const {
    data: rules = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useRecurringRules();
  const { data: allCategories = [] } = useCategories();

  const createMutation = useCreateRecurringRule();
  const updateMutation = useUpdateRecurringRule();
  const deleteMutation = useDeleteRecurringRule();
  const toggleMutation = useToggleRecurringRule();

  const isMutationBusy =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    toggleMutation.isPending;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RecurringRuleFormData>({
    resolver: zodResolver(recurringRuleFormSchema),
    defaultValues: {
      type: 'expense',
      amount_cents: 0,
      category_id: '',
      description: '',
      frequency: 'monthly',
      day_of_month: 10,
      weekday: 1,
      start_date: getTodayISO(),
      end_date: '',
      is_active: 1,
    },
  });

  const selectedType = watch('type');
  const selectedCategoryId = watch('category_id');
  const selectedFrequency = watch('frequency');

  const filteredCategories = useMemo(
    () => allCategories.filter((c) => c.type === selectedType),
    [allCategories, selectedType]
  );

  const openModalForNew = () => {
    const firstCat =
      allCategories.find((c) => c.type === 'expense')?.id ||
      allCategories[0]?.id ||
      '';
    const today = getTodayISO();
    const parsed = parseYMD(today);

    setEditingRuleId(null);
    reset({
      type: 'expense',
      amount_cents: 0,
      category_id: firstCat,
      description: '',
      frequency: 'monthly',
      day_of_month: parsed.day,
      weekday: getWeekdayYMD(today),
      start_date: today,
      end_date: '',
      is_active: 1,
    });
    setModalVisible(true);
  };

  const openModalForEdit = (rule: RecurringRuleWithCategory) => {
    setEditingRuleId(rule.id);
    reset({
      type: rule.type,
      amount_cents: rule.amount_cents,
      category_id: rule.category_id,
      description: rule.description ?? '',
      frequency: rule.frequency,
      day_of_month: rule.day_of_month ?? parseYMD(rule.start_date).day,
      weekday: rule.weekday ?? getWeekdayYMD(rule.start_date),
      start_date: rule.start_date,
      end_date: rule.end_date ?? '',
      is_active: rule.is_active,
    });
    setModalVisible(true);
  };

  const onSubmit = async (values: RecurringRuleFormData) => {
    try {
      const parsedStart = parseYMD(values.start_date);
      const dayOfMonth =
        values.frequency === 'weekly'
          ? null
          : values.day_of_month ?? parsedStart.day;
      const weekday =
        values.frequency === 'weekly'
          ? values.weekday ?? getWeekdayYMD(values.start_date)
          : null;

      const payload = {
        category_id: values.category_id,
        type: values.type,
        amount_cents: values.amount_cents,
        description: values.description?.trim() || null,
        frequency: values.frequency as RecurringFrequency,
        day_of_month: dayOfMonth,
        weekday,
        start_date: values.start_date,
        end_date: values.end_date?.trim() || null,
        is_active: values.is_active ?? 1,
      };

      if (editingRuleId) {
        await updateMutation.mutateAsync({
          id: editingRuleId,
          ...payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }

      setModalVisible(false);
    } catch (err: any) {
      Alert.alert(
        'Erro ao salvar regra',
        err?.message || 'Não foi possível salvar a regra recorrente.'
      );
    }
  };

  const handleDelete = (rule: RecurringRuleWithCategory) => {
    if (isMutationBusy) return;

    Alert.alert(
      'Excluir regra recorrente',
      `Deseja realmente excluir a regra "${rule.description || rule.category_name}"?\n\nAs transações já geradas anteriormente continuarão salvas no seu histórico como avulsas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(rule.id);
            } catch (err: any) {
              Alert.alert(
                'Erro ao excluir',
                err?.message || 'Não foi possível excluir a regra.'
              );
            }
          },
        },
      ]
    );
  };

  const handleToggle = async (rule: RecurringRuleWithCategory) => {
    if (isMutationBusy) return;
    try {
      await toggleMutation.mutateAsync({
        id: rule.id,
        isActive: rule.is_active === 0,
      });
    } catch (err: any) {
      Alert.alert(
        'Erro ao alterar status',
        err?.message || 'Não foi possível alterar o status da regra.'
      );
    }
  };

  const formatFrequencyLabel = (rule: RecurringRuleWithCategory) => {
    if (rule.frequency === 'weekly') {
      const wDay = rule.weekday ?? getWeekdayYMD(rule.start_date);
      return `Semanal • Toda ${WEEKDAY_NAMES[wDay] || 'semana'}`;
    }
    if (rule.frequency === 'monthly') {
      const d = rule.day_of_month ?? parseYMD(rule.start_date).day;
      return `Mensal • Todo dia ${d}`;
    }
    if (rule.frequency === 'yearly') {
      const p = parseYMD(rule.start_date);
      const d = rule.day_of_month ?? p.day;
      return `Anual • Todo dia ${String(d).padStart(2, '0')}/${String(
        p.month
      ).padStart(2, '0')}`;
    }
    return 'Recorrente';
  };

  return (
    <SafeAreaView
      edges={Platform.OS === 'ios' ? ['top', 'left', 'right'] : ['top']}
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.scrollContent,
          maxContentWidth
            ? {
                maxWidth: maxContentWidth,
                width: '100%',
                alignSelf: 'center',
              }
            : null,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topHeader}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            style={styles.backButton}
          >
            <ArrowLeft size={22} color={theme.colors.textPrimary} />
          </Pressable>

          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <Text
              style={[
                theme.typography.h1,
                { color: theme.colors.textPrimary },
              ]}
            >
              Recorrentes
            </Text>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary },
              ]}
            >
              Assinaturas, contas fixas e salários automáticos
            </Text>
          </View>

          <ClayButton
            title="Nova"
            size="sm"
            icon={<Plus size={16} color="#FFFFFF" />}
            onPress={openModalForNew}
            disabled={isMutationBusy}
          />
        </View>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text
              style={[
                theme.typography.bodySmall,
                { color: theme.colors.textSecondary, marginTop: 12 },
              ]}
            >
              Carregando regras...
            </Text>
          </View>
        ) : isError ? (
          <ClayCard radius="xl" style={styles.errorCard}>
            <AlertTriangle size={32} color={theme.colors.expense} />
            <Text
              style={[
                theme.typography.h3,
                { color: theme.colors.textPrimary, marginTop: 8 },
              ]}
            >
              Erro ao carregar regras
            </Text>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 4 },
              ]}
            >
              {(error as any)?.message || 'Não foi possível buscar as regras cadastradas.'}
            </Text>
            <ClayButton
              title="Tentar novamente"
              size="sm"
              variant="secondary"
              icon={<RotateCcw size={16} color={theme.colors.textPrimary} />}
              onPress={() => refetch()}
              style={{ marginTop: 12 }}
            />
          </ClayCard>
        ) : rules.length === 0 ? (
          <ClayEmptyState
            title="Nenhuma regra cadastrada"
            description="Cadastre suas contas fixas, assinaturas ou salários para gerar transações automaticamente."
            actionLabel="Criar Primeira Regra"
            onAction={openModalForNew}
          />
        ) : (
          rules.map((rule) => {
            const isIncome = rule.type === 'income';
            const isActive = rule.is_active === 1;
            const nextDate = isActive
              ? getNextOccurrence(rule, getTodayISO())
              : null;

            return (
              <ClayCard key={rule.id} radius="xl" style={styles.ruleCard}>
                <View style={styles.cardHeaderRow}>
                  <View
                    style={[
                      styles.iconBubble,
                      { backgroundColor: `${rule.category_color}24` },
                    ]}
                  >
                    <DynamicIcon
                      name={rule.category_icon}
                      size={20}
                      color={rule.category_color}
                    />
                  </View>

                  <View style={styles.titleCol}>
                    <Text
                      numberOfLines={1}
                      style={[
                        theme.typography.h3,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      {rule.description || rule.category_name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        theme.typography.caption,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {rule.category_name}
                    </Text>
                  </View>

                  <View style={styles.amountCol}>
                    <Text
                      style={[
                        theme.typography.h3,
                        {
                          color: isIncome
                            ? theme.colors.incomeDark
                            : theme.colors.expenseDark,
                          fontFamily: theme.fontFamilies.extraBold,
                        },
                      ]}
                    >
                      {isIncome ? '+ ' : '- '}
                      {formatCentsToBRL(rule.amount_cents)}
                    </Text>
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: isActive
                            ? `${theme.colors.income}22`
                            : `${theme.colors.textMuted}22`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          theme.typography.caption,
                          {
                            color: isActive
                              ? theme.colors.incomeDark
                              : theme.colors.textMuted,
                            fontSize: 11,
                            fontFamily: theme.fontFamilies.bold,
                          },
                        ]}
                      >
                        {isActive ? 'Ativa' : 'Pausada'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.frequencyTag}>
                    <Repeat size={14} color={theme.colors.primary} />
                    <Text
                      style={[
                        theme.typography.caption,
                        { color: theme.colors.textPrimary, marginLeft: 6 },
                      ]}
                    >
                      {formatFrequencyLabel(rule)}
                    </Text>
                  </View>

                  <View style={styles.nextDateTag}>
                    <Calendar size={14} color={theme.colors.textSecondary} />
                    <Text
                      style={[
                        theme.typography.caption,
                        { color: theme.colors.textSecondary, marginLeft: 6 },
                      ]}
                    >
                      {nextDate
                        ? `Próxima: ${formatDateShortPtBR(nextDate)}`
                        : 'Sem ocorrência futura'}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardActionsRow}>
                  <ClayButton
                    title={isActive ? 'Pausar' : 'Ativar'}
                    size="sm"
                    variant="secondary"
                    icon={
                      isActive ? (
                        <Pause size={14} color={theme.colors.textPrimary} />
                      ) : (
                        <Play size={14} color={theme.colors.incomeDark} />
                      )
                    }
                    onPress={() => handleToggle(rule)}
                    disabled={isMutationBusy}
                    style={styles.actionBtn}
                  />

                  <ClayButton
                    title="Editar"
                    size="sm"
                    variant="secondary"
                    icon={<Edit3 size={14} color={theme.colors.primary} />}
                    onPress={() => openModalForEdit(rule)}
                    disabled={isMutationBusy}
                    style={styles.actionBtn}
                  />

                  <ClayButton
                    title="Excluir"
                    size="sm"
                    variant="danger"
                    icon={<Trash2 size={14} color="#FFFFFF" />}
                    onPress={() => handleDelete(rule)}
                    disabled={isMutationBusy}
                    style={styles.actionBtn}
                  />
                </View>
              </ClayCard>
            );
          })
        )}
      </ScrollView>

      {/* Modal de Criação / Edição de Regra Recorrente */}
      <ClayModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={editingRuleId ? 'Editar Regra' : 'Nova Regra Recorrente'}
        subtitle="Ocorrências serão geradas automaticamente pelo app"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.modalScroll,
            maxFormWidth ? { maxWidth: maxFormWidth, alignSelf: 'center' } : null,
          ]}
        >
          {/* Alternador de Tipo */}
          <View style={styles.typeToggleRow}>
            <ClayChip
              label="Despesa"
              selected={selectedType === 'expense'}
              accentColor={theme.colors.expense}
              icon={
                <ArrowDownCircle
                  size={16}
                  color={selectedType === 'expense' ? '#FFFFFF' : theme.colors.expenseDark}
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
                  size={16}
                  color={selectedType === 'income' ? '#FFFFFF' : theme.colors.incomeDark}
                />
              }
              onPress={() => setValue('type', 'income')}
              style={styles.typeChip}
            />
          </View>

          {/* Valor */}
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

          {/* Seleção de Categoria */}
          <Text
            style={[
              theme.typography.caption,
              styles.fieldLabel,
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
                      size={15}
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
            <Text style={[styles.fieldError, { color: theme.colors.expenseDark }]}>
              {errors.category_id.message}
            </Text>
          ) : null}

          {/* Descrição */}
          <Controller
            control={control}
            name="description"
            render={({ field: { value, onChange } }) => (
              <ClayInput
                label="Descrição (opcional)"
                placeholder="Ex.: Internet fibra, Aluguel, Salário..."
                value={value ?? ''}
                onChangeText={onChange}
                leftIcon={<FileText size={18} color={theme.colors.textSecondary} />}
                errorMessage={errors.description?.message}
              />
            )}
          />

          {/* Frequência */}
          <Text
            style={[
              theme.typography.caption,
              styles.fieldLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Frequência
          </Text>
          <View style={styles.frequencyToggleRow}>
            {(['weekly', 'monthly', 'yearly'] as const).map((freq) => {
              const label =
                freq === 'weekly' ? 'Semanal' : freq === 'monthly' ? 'Mensal' : 'Anual';
              const isSelected = selectedFrequency === freq;
              return (
                <ClayChip
                  key={freq}
                  label={label}
                  selected={isSelected}
                  accentColor={theme.colors.primary}
                  onPress={() => setValue('frequency', freq)}
                  style={styles.frequencyChip}
                />
              );
            })}
          </View>

          {/* Data de Início */}
          <Controller
            control={control}
            name="start_date"
            render={({ field: { value, onChange } }) => (
              <NativeDateField
                label="Data de início"
                value={value}
                onChange={(newVal) => {
                  onChange(newVal);
                  // Atualiza day_of_month ou weekday automaticamente
                  const parsed = parseYMD(newVal);
                  setValue('day_of_month', parsed.day);
                  setValue('weekday', getWeekdayYMD(newVal));
                }}
                errorMessage={errors.start_date?.message}
              />
            )}
          />

          {/* Data de Término (Opcional) */}
          <Controller
            control={control}
            name="end_date"
            render={({ field: { value, onChange } }) => (
              <NativeDateField
                label="Data de término (opcional)"
                value={value ?? ''}
                onChange={onChange}
                errorMessage={errors.end_date?.message}
              />
            )}
          />

          <View style={{ marginTop: 14 }}>
            <ClayButton
              title={editingRuleId ? 'Salvar Alterações' : 'Criar Regra Recorrente'}
              variant={selectedType === 'income' ? 'income' : 'primary'}
              size="lg"
              onPress={handleSubmit(onSubmit)}
              loading={
                isSubmitting ||
                createMutation.isPending ||
                updateMutation.isPending
              }
              disabled={
                isSubmitting ||
                createMutation.isPending ||
                updateMutation.isPending
              }
            />
          </View>
        </ScrollView>
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCard: {
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  ruleCard: {
    marginBottom: 14,
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleCol: {
    flex: 1,
    paddingRight: 8,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  frequencyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(122, 90, 248, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  nextDateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
  },
  modalScroll: {
    paddingBottom: 24,
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  typeChip: {
    flex: 1,
  },
  fieldLabel: {
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 4,
  },
  fieldError: {
    fontSize: 12,
    marginTop: -4,
    marginBottom: 10,
    marginLeft: 4,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  categoryChip: {
    marginBottom: 2,
  },
  frequencyToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  frequencyChip: {
    flex: 1,
  },
});
