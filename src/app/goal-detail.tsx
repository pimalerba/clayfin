import React, { useState } from 'react';
import {
  Alert,
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
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Edit3,
  PiggyBank,
  Trash2,
} from 'lucide-react-native';
import { useAppTheme } from '@/theme';
import {
  useAddGoalContribution,
  useDeleteGoalContribution,
  useGoalContributions,
  useGoalDetail,
} from '@/hooks';
import {
  ClayButton,
  ClayCard,
  ClayEmptyState,
  ClayInput,
  ClayLoadingState,
  ClayModal,
  ClayProgressBar,
} from '@/components/ui';
import {
  ContributionFormData,
  contributionFormSchema,
} from '@/features/schemas';
import { formatCentsToBRL } from '@/utils/currency';
import { formatDateShortPtBR, getTodayISO } from '@/utils/date';
import { calculateGoalProgress } from '@/utils/progress';
import { DynamicIcon } from '@/utils/icons';

export default function GoalDetailScreen() {
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const goalId = params.id;

  const { data: goal, isLoading } = useGoalDetail(goalId);
  const { data: contributions = [] } = useGoalContributions(goalId);
  const addContributionMutation = useAddGoalContribution();
  const deleteContributionMutation = useDeleteGoalContribution();

  const [modalVisible, setModalVisible] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContributionFormData>({
    resolver: zodResolver(contributionFormSchema),
    defaultValues: {
      mode: 'deposit',
      amount_cents: 0,
      date: getTodayISO(),
    },
  });

  const currentMode = watch('mode');

  const openContributionModal = (mode: 'deposit' | 'withdraw') => {
    reset({
      mode,
      amount_cents: 0,
      date: getTodayISO(),
    });
    setModalVisible(true);
  };

  const onSubmitContribution = async (values: ContributionFormData) => {
    if (!goal) return;

    if (
      values.mode === 'withdraw' &&
      values.amount_cents > Math.max(0, goal.current_cents)
    ) {
      Alert.alert(
        'Saldo insuficiente no cofrinho',
        `Você possui ${formatCentsToBRL(
          Math.max(0, goal.current_cents)
        )} disponível para retirada.`
      );
      return;
    }

    const signedAmount =
      values.mode === 'deposit' ? values.amount_cents : -values.amount_cents;

    await addContributionMutation.mutateAsync({
      goal_id: goal.id,
      amount_cents: signedAmount,
      date: values.date,
    });
    setModalVisible(false);
  };

  if (isLoading || !goal) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.colors.background }]}
      >
        <View style={{ padding: 20 }}>
          <ClayLoadingState message="Carregando detalhes do cofrinho..." />
        </View>
      </SafeAreaView>
    );
  }

  const progress = calculateGoalProgress(goal.current_cents, goal.target_cents);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={[styles.iconBtn, { backgroundColor: theme.colors.surface }]}
        >
          <ArrowLeft size={22} color={theme.colors.textPrimary} />
        </Pressable>

        <Text
          numberOfLines={1}
          style={[
            theme.typography.h2,
            { color: theme.colors.textPrimary, flex: 1, textAlign: 'center' },
          ]}
        >
          {goal.name}
        </Text>

        <Pressable
          onPress={() =>
            router.push({ pathname: '/goal-form', params: { id: goal.id } })
          }
          accessibilityRole="button"
          accessibilityLabel="Editar meta"
          style={[styles.iconBtn, { backgroundColor: theme.colors.surface }]}
        >
          <Edit3 size={20} color={theme.colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ClayCard variant="primary" radius="xxl" style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIcon}>
              <DynamicIcon name={goal.icon} size={28} color="#FFFFFF" />
            </View>
            <View style={styles.percentBadge}>
              <Text style={[theme.typography.caption, { color: '#FFFFFF' }]}>
                {progress.percentage}% concluído
              </Text>
            </View>
          </View>

          <Text
            style={[
              theme.typography.bodySmall,
              { color: '#E8E0FF', marginTop: 14 },
            ]}
          >
            Saldo no Cofrinho
          </Text>
          <Text style={[theme.typography.hero, { color: '#FFFFFF' }]}>
            {formatCentsToBRL(progress.currentCents)}
          </Text>

          <ClayProgressBar
            percentage={progress.percentage}
            customColor={
              progress.isCompleted ? theme.colors.income : '#FFFFFF'
            }
            height={14}
            style={{ marginVertical: 14 }}
          />

          <View style={styles.heroFooter}>
            <Text style={[theme.typography.caption, { color: '#EDE7FF' }]}>
              Meta: {formatCentsToBRL(goal.target_cents)}
            </Text>
            <Text style={[theme.typography.caption, { color: '#EDE7FF' }]}>
              Faltam: {formatCentsToBRL(progress.remainingCents)}
            </Text>
          </View>
        </ClayCard>

        <View style={styles.actionsRow}>
          <ClayButton
            title="Guardar"
            variant="income"
            icon={<ArrowUpRight size={18} color="#FFFFFF" />}
            onPress={() => openContributionModal('deposit')}
            style={{ flex: 1 }}
          />
          <ClayButton
            title="Retirar"
            variant="secondary"
            icon={
              <ArrowDownLeft size={18} color={theme.colors.expenseDark} />
            }
            onPress={() => openContributionModal('withdraw')}
            style={{ flex: 1 }}
          />
        </View>

        <Text
          style={[
            theme.typography.h3,
            styles.historyTitle,
            { color: theme.colors.textPrimary },
          ]}
        >
          Histórico de Movimentações
        </Text>

        {contributions.length === 0 ? (
          <ClayEmptyState
            icon={<PiggyBank size={26} color={theme.colors.primary} />}
            title="Nenhum aporte registrado"
            description="Toque em Guardar para adicionar dinheiro ao seu cofrinho."
          />
        ) : (
          contributions.map((item) => {
            const isDeposit = item.amount_cents > 0;
            return (
              <ClayCard
                key={item.id}
                radius="lg"
                padding={14}
                style={styles.contributionRow}
              >
                <View style={styles.rowInner}>
                  <View
                    style={[
                      styles.contribBadge,
                      {
                        backgroundColor: isDeposit
                          ? theme.colors.incomeLight
                          : theme.colors.expenseLight,
                      },
                    ]}
                  >
                    {isDeposit ? (
                      <ArrowUpRight
                        size={18}
                        color={theme.colors.incomeDark}
                      />
                    ) : (
                      <ArrowDownLeft
                        size={18}
                        color={theme.colors.expenseDark}
                      />
                    )}
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
                      {isDeposit ? 'Aporte no cofrinho' : 'Retirada do cofrinho'}
                    </Text>
                    <Text
                      style={[
                        theme.typography.caption,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {formatDateShortPtBR(item.date)}
                    </Text>
                  </View>

                  <Text
                    style={[
                      theme.typography.h3,
                      {
                        color: isDeposit
                          ? theme.colors.incomeDark
                          : theme.colors.expenseDark,
                        marginRight: 8,
                      },
                    ]}
                  >
                    {isDeposit ? '+' : '-'}
                    {formatCentsToBRL(Math.abs(item.amount_cents))}
                  </Text>

                  <Pressable
                    onPress={() =>
                      deleteContributionMutation.mutate({
                        id: item.id,
                        goalId: goal.id,
                      })
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Excluir registro"
                    style={styles.deleteBtn}
                  >
                    <Trash2 size={16} color={theme.colors.textMuted} />
                  </Pressable>
                </View>
              </ClayCard>
            );
          })
        )}
      </ScrollView>

      <ClayModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={
          currentMode === 'deposit'
            ? 'Guardar no Cofrinho'
            : 'Retirar do Cofrinho'
        }
        subtitle={goal.name}
      >
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

        <Controller
          control={control}
          name="date"
          render={({ field: { value, onChange } }) => (
            <ClayInput
              label="Data (AAAA-MM-DD)"
              value={value}
              onChangeText={onChange}
              leftIcon={
                <Calendar size={18} color={theme.colors.textSecondary} />
              }
              errorMessage={errors.date?.message}
            />
          )}
        />

        <ClayButton
          title={
            currentMode === 'deposit' ? 'Confirmar Aporte' : 'Confirmar Retirada'
          }
          variant={currentMode === 'deposit' ? 'income' : 'danger'}
          onPress={handleSubmit(onSubmitContribution)}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 50,
  },
  heroCard: {
    marginBottom: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 22,
  },
  historyTitle: {
    marginBottom: 12,
  },
  contributionRow: {
    marginBottom: 10,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contribBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
