import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, PiggyBank, Plus, Sparkles } from 'lucide-react-native';
import { useAppTheme } from '@/theme';
import {
  useAvailableAccountBalance,
  useGoals,
  useLiquidGlass,
  useWindowClass,
} from '@/hooks';
import {
  ClayButton,
  ClayCard,
  ClayEmptyState,
  ClayLoadingState,
  ClayProgressBar,
  GlassContainer,
  GlassSurface,
} from '@/components/ui';
import { formatCentsToBRL } from '@/utils/currency';
import { formatDateShortPtBR } from '@/utils/date';
import { calculateGoalProgress } from '@/utils/progress';
import { DynamicIcon } from '@/utils/icons';

export default function GoalsScreen() {
  const theme = useAppTheme();
  const isLiquidGlass = useLiquidGlass();
  const { maxContentWidth } = useWindowClass();
  const { data: goals = [], isLoading } = useGoals();
  const { data: availableAccountCents = 0 } = useAvailableAccountBalance();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/more');
    }
  };

  const totalSavedCents = goals.reduce(
    (acc, g) => acc + Math.max(0, g.current_cents),
    0
  );
  const totalTargetCents = goals.reduce((acc, g) => acc + g.target_cents, 0);

  return (
    <SafeAreaView
      edges={Platform.OS === 'ios' ? ['top', 'left', 'right'] : ['top']}
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
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
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            {isLiquidGlass ? (
              <GlassContainer spacing={8}>
                <Pressable
                  onPress={handleBack}
                  accessibilityRole="button"
                  accessibilityLabel="Voltar para Mais"
                >
                  <GlassSurface
                    interactive
                    tintColor={theme.isDark ? "rgba(157, 133, 242, 0.20)" : "rgba(122, 90, 248, 0.16)"}
                    borderRadius={14}
                    style={styles.backBtn}
                  >
                    <ArrowLeft size={20} color={theme.colors.textPrimary} strokeWidth={2.4} />
                  </GlassSurface>
                </Pressable>
              </GlassContainer>
            ) : (
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
            )}
            <Text
              style={[theme.typography.h1, { color: theme.colors.textPrimary }]}
            >
              Metas & Cofrinhos
            </Text>
          </View>
          <ClayButton
            title="Nova Meta"
            size="sm"
            icon={<Plus size={16} color="#FFFFFF" />}
            onPress={() => router.push('/goal-form')}
          />
        </View>

        <ClayCard variant="primary" radius="xl" style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text
                style={[theme.typography.bodySmall, { color: '#EDE7FF' }]}
              >
                Total Guardado nos Cofrinhos
              </Text>
              <Text
                style={[
                  theme.typography.hero,
                  { color: '#FFFFFF', marginTop: 2 },
                ]}
              >
                {formatCentsToBRL(totalSavedCents)}
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  { color: '#E2D9FF', marginTop: 4 },
                ]}
              >
                Disponível em conta para guardar:{' '}
                {formatCentsToBRL(Math.max(0, availableAccountCents))} • Soma das
                metas: {formatCentsToBRL(totalTargetCents)}
              </Text>
            </View>
            <View style={styles.piggyBadge}>
              <PiggyBank size={30} color="#FFFFFF" />
            </View>
          </View>
        </ClayCard>

        {isLoading ? (
          <ClayLoadingState message="Carregando cofrinhos..." />
        ) : goals.length === 0 ? (
          <ClayEmptyState
            icon={<PiggyBank size={28} color={theme.colors.primary} />}
            title="Nenhum cofrinho criado"
            description="Crie uma meta para sua reserva de emergência, viagem ou sonho e acompanhe cada aporte."
            actionLabel="Criar Primeiro Cofrinho"
            onAction={() => router.push('/goal-form')}
          />
        ) : (
          goals.map((goal) => {
            const progress = calculateGoalProgress(
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
                style={styles.goalCard}
              >
                <View style={styles.goalHeader}>
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: progress.isCompleted
                          ? theme.colors.incomeLight
                          : theme.colors.primaryLight,
                      },
                    ]}
                  >
                    <DynamicIcon
                      name={goal.icon}
                      size={22}
                      color={
                        progress.isCompleted
                          ? theme.colors.incomeDark
                          : theme.colors.primary
                      }
                    />
                  </View>

                  <View style={styles.titleCol}>
                    <Text
                      style={[
                        theme.typography.h3,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      {goal.name}
                    </Text>
                    {goal.deadline ? (
                      <View style={styles.deadlineRow}>
                        <Calendar
                          size={13}
                          color={theme.colors.textSecondary}
                        />
                        <Text
                          style={[
                            theme.typography.caption,
                            {
                              color: theme.colors.textSecondary,
                              marginLeft: 4,
                            },
                          ]}
                        >
                          Prazo: {formatDateShortPtBR(goal.deadline)}
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={[
                          theme.typography.caption,
                          { color: theme.colors.textMuted },
                        ]}
                      >
                        Sem prazo definido
                      </Text>
                    )}
                  </View>

                  <View
                    style={[
                      styles.percentPill,
                      {
                        backgroundColor: progress.isCompleted
                          ? theme.colors.incomeLight
                          : theme.colors.primaryLight,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        theme.typography.caption,
                        {
                          color: progress.isCompleted
                            ? theme.colors.incomeDark
                            : theme.colors.primaryDark,
                        },
                      ]}
                    >
                      {progress.percentage}%
                    </Text>
                  </View>
                </View>

                <ClayProgressBar
                  percentage={progress.percentage}
                  customColor={
                    progress.isCompleted
                      ? theme.colors.income
                      : theme.colors.primary
                  }
                  style={{ marginVertical: 12 }}
                />

                <View style={styles.valuesRow}>
                  <Text
                    style={[
                      theme.typography.body,
                      {
                        color: theme.colors.textPrimary,
                        fontFamily: theme.fontFamilies.extraBold,
                      },
                    ]}
                  >
                    {formatCentsToBRL(progress.currentCents)}
                  </Text>
                  <Text
                    style={[
                      theme.typography.bodySmall,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Meta: {formatCentsToBRL(goal.target_cents)}
                  </Text>
                </View>

                {progress.isCompleted ? (
                  <View style={styles.completedBanner}>
                    <Sparkles size={14} color={theme.colors.incomeDark} />
                    <Text
                      style={[
                        theme.typography.caption,
                        { color: theme.colors.incomeDark, marginLeft: 6 },
                      ]}
                    >
                      Meta concluída! Parabéns!
                    </Text>
                  </View>
                ) : null}
              </ClayCard>
            );
          })
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    marginBottom: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  piggyBadge: {
    width: 58,
    height: 58,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalCard: {
    marginBottom: 14,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleCol: {
    flex: 1,
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  percentPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  valuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
});
