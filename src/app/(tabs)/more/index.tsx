import React, { useRef } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useScrollToTop } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BarChart3,
  ChevronRight,
  FolderKanban,
  PiggyBank,
  Settings,
  ShieldCheck,
} from 'lucide-react-native';
import { useAppTheme } from '@/theme';
import {
  useAvailableAccountBalance,
  useGoals,
  useWindowClass,
} from '@/hooks';
import { ClayCard } from '@/components/ui';
import { formatCentsToBRL } from '@/utils/currency';

export default function MoreScreen() {
  const theme = useAppTheme();
  const { maxContentWidth } = useWindowClass();
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  useScrollToTop(scrollRef as any);

  const { data: goals = [] } = useGoals();
  const { data: availableAccountCents = 0 } = useAvailableAccountBalance();

  const totalSavedInGoals = goals.reduce(
    (acc, g) => acc + Math.max(0, g.current_cents),
    0
  );

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
        <View style={styles.headerRow}>
          <Text
            style={[theme.typography.h1, { color: theme.colors.textPrimary }]}
          >
            Mais Opções
          </Text>
          <Text
            style={[
              theme.typography.bodySmall,
              { color: theme.colors.textSecondary, marginTop: 2 },
            ]}
          >
            Acesse seus cofrinhos, relatórios detalhados e ajustes do Clayfin
          </Text>
        </View>

        <ClayCard
          radius="xl"
          onPress={() => router.push('/(tabs)/more/goals')}
          style={styles.menuCard}
        >
          <View style={styles.menuRow}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: theme.colors.primaryLight },
              ]}
            >
              <PiggyBank size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.textCol}>
              <Text
                style={[
                  theme.typography.h3,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Metas & Cofrinhos
              </Text>
              <Text
                style={[
                  theme.typography.bodySmall,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {goals.length} cofrinho(s) • Guardado:{' '}
                {formatCentsToBRL(totalSavedInGoals)}
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.primary, marginTop: 2 },
                ]}
              >
                Disponível em conta para guardar:{' '}
                {formatCentsToBRL(Math.max(0, availableAccountCents))}
              </Text>
            </View>
            <ChevronRight size={20} color={theme.colors.textMuted} />
          </View>
        </ClayCard>

        <ClayCard
          radius="xl"
          onPress={() => router.push('/(tabs)/more/reports')}
          style={styles.menuCard}
        >
          <View style={styles.menuRow}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: theme.colors.secondaryLight },
              ]}
            >
              <BarChart3 size={24} color={theme.colors.secondary} />
            </View>
            <View style={styles.textCol}>
              <Text
                style={[
                  theme.typography.h3,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Relatórios & Gráficos
              </Text>
              <Text
                style={[
                  theme.typography.bodySmall,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Despesas por categoria, fluxo de 6 meses e resumo mensal
              </Text>
            </View>
            <ChevronRight size={20} color={theme.colors.textMuted} />
          </View>
        </ClayCard>

        <ClayCard
          radius="xl"
          onPress={() => router.push('/(tabs)/more/settings')}
          style={styles.menuCard}
        >
          <View style={styles.menuRow}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: theme.colors.incomeLight },
              ]}
            >
              <Settings size={24} color={theme.colors.incomeDark} />
            </View>
            <View style={styles.textCol}>
              <Text
                style={[
                  theme.typography.h3,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Ajustes, Categorias & Backup
              </Text>
              <Text
                style={[
                  theme.typography.bodySmall,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Gerenciar categorias, exportar/importar JSON e limpar dados
              </Text>
            </View>
            <ChevronRight size={20} color={theme.colors.textMuted} />
          </View>
        </ClayCard>

        <ClayCard
          radius="xl"
          onPress={() => router.push('/category-form')}
          style={styles.menuCard}
        >
          <View style={styles.menuRow}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: theme.colors.warningLight },
              ]}
            >
              <FolderKanban size={24} color={theme.colors.warningDark} />
            </View>
            <View style={styles.textCol}>
              <Text
                style={[
                  theme.typography.h3,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Criar Nova Categoria
              </Text>
              <Text
                style={[
                  theme.typography.bodySmall,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Personalize ícones e cores para suas receitas e despesas
              </Text>
            </View>
            <ChevronRight size={20} color={theme.colors.textMuted} />
          </View>
        </ClayCard>

        <ClayCard variant="subtle" radius="xl" style={styles.infoCard}>
          <View style={styles.menuRow}>
            <ShieldCheck size={20} color={theme.colors.primary} />
            <Text
              style={[
                theme.typography.caption,
                {
                  color: theme.colors.textSecondary,
                  marginLeft: 10,
                  flex: 1,
                },
              ]}
            >
              Seus dados permanecem salvos 100% offline no banco SQLite deste
              aparelho.
            </Text>
          </View>
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
    marginTop: 8,
    marginBottom: 18,
  },
  menuCard: {
    marginBottom: 14,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textCol: {
    flex: 1,
    paddingRight: 8,
  },
  infoCard: {
    marginTop: 6,
  },
});
