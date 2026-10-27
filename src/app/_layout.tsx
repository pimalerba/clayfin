import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertTriangle, RotateCcw } from 'lucide-react-native';
import { getDatabase } from '@/db';
import { RecurringRepository } from '@/repositories';
import { queryKeys } from '@/hooks';
import { getTodayISO } from '@/utils/date';
import { useLiquidGlass } from '@/hooks/useLiquidGlass';
import {
  ThemePreferenceProvider,
  useAppTheme,
  useThemePreference,
} from '@/theme';
import { ClayButton, ClayCard } from '@/components/ui';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
    },
  },
});

type DbState = 'loading' | 'ready' | 'error';

function RootLayoutInner() {
  const theme = useAppTheme();
  const { isReady: isThemeReady } = useThemePreference();
  const isLiquidGlass = useLiquidGlass();
  const [dbState, setDbState] = useState<DbState>('loading');
  const [dbErrorMessage, setDbErrorMessage] = useState<string | null>(null);

  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  const formSheetOptions = useMemo(
    () =>
      Platform.OS === 'ios'
        ? ({
            presentation: 'formSheet' as const,
            sheetAllowedDetents: [0.78, 1.0],
            sheetInitialDetentIndex: 0,
            sheetGrabberVisible: true,
            sheetExpandsWhenScrolledToEdge: true,
            sheetCornerRadius: 28,
            contentStyle: {
              backgroundColor: isLiquidGlass
                ? 'transparent'
                : theme.colors.background,
            },
          })
        : ({
            presentation: 'modal' as const,
            animation: 'slide_from_bottom' as const,
          }),
    [isLiquidGlass, theme.colors.background]
  );

  const initDatabase = useCallback(() => {
    setDbErrorMessage(null);
    setDbState('loading');

    getDatabase()
      .then(() => {
        setDbState('ready');
      })
      .catch((err) => {
        console.error('Erro ao inicializar SQLite:', err);
        setDbState('error');
        setDbErrorMessage(
          err?.message ?? 'Não foi possível carregar o banco de dados local.'
        );
      });
  }, []);

  useEffect(() => {
    let isMounted = true;
    getDatabase()
      .then(() => {
        if (isMounted) {
          setDbState('ready');
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Erro ao inicializar SQLite:', err);
          setDbState('error');
          setDbErrorMessage(
            err?.message ?? 'Não foi possível carregar o banco de dados local.'
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const syncRecurring = useCallback(async () => {
    try {
      const today = getTodayISO();
      const count = await RecurringRepository.generateDue(today);
      if (count > 0) {
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all });
      }
    } catch (err) {
      console.error('Erro ao processar transações recorrentes devidas:', err);
    }
  }, []);

  useEffect(() => {
    if (dbState !== 'ready') return;

    // Executa ao iniciar o app com banco pronto
    syncRecurring();

    // Executa quando o app volta ao primeiro plano
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        syncRecurring();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [dbState, syncRecurring]);

  const fontsReady = fontsLoaded || Boolean(fontError);
  const isAppReady = fontsReady && dbState === 'ready' && isThemeReady;

  const navigationTheme = useMemo<Theme>(
    () => ({
      ...DefaultTheme,
      dark: theme.isDark,
      colors: {
        ...DefaultTheme.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.textPrimary,
        border: theme.colors.border,
        notification: theme.colors.expense,
      },
    }),
    [theme]
  );

  useEffect(() => {
    if (isAppReady || (dbState === 'error' && fontsReady)) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isAppReady, dbState, fontsReady]);

  if (dbState === 'error') {
    return (
      <View
        style={[
          styles.centerScreen,
          { backgroundColor: theme.colors.background, padding: 24 },
        ]}
      >
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        <ClayCard radius="xl" style={styles.errorCard}>
          <View
            style={[
              styles.errorIconCircle,
              { backgroundColor: theme.colors.expenseLight },
            ]}
          >
            <AlertTriangle size={32} color={theme.colors.expenseDark} />
          </View>
          <Text
            style={[
              theme.typography.h2,
              styles.errorTitle,
              { color: theme.colors.textPrimary },
            ]}
          >
            Ops! Falha ao carregar seus dados
          </Text>
          <Text
            style={[
              theme.typography.body,
              styles.errorDescription,
              { color: theme.colors.textSecondary },
            ]}
          >
            Não foi possível inicializar o banco de dados local do Clayfin. Seus
            dados continuam salvos com segurança no aparelho.
          </Text>
          {dbErrorMessage ? (
            <Text
              style={[
                theme.typography.caption,
                styles.errorDetails,
                { color: theme.colors.textMuted },
              ]}
              numberOfLines={3}
            >
              Detalhe técnico: {dbErrorMessage}
            </Text>
          ) : null}
          <ClayButton
            title="Tentar novamente"
            onPress={initDatabase}
            variant="primary"
            size="lg"
            icon={<RotateCcw size={18} color="#FFFFFF" />}
            style={styles.retryButton}
          />
        </ClayCard>
      </View>
    );
  }

  if (!isAppReady) {
    return (
      <View
        style={[
          styles.loadingScreen,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={navigationTheme}>
            <StatusBar style={theme.isDark ? 'light' : 'dark'} />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.colors.background },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="onboarding"
                options={{
                  headerShown: false,
                  animation: 'fade',
                }}
              />
              <Stack.Screen
                name="transaction-form"
                options={formSheetOptions}
              />
              <Stack.Screen
                name="category-form"
                options={formSheetOptions}
              />
              <Stack.Screen
                name="goal-form"
                options={formSheetOptions}
              />
              <Stack.Screen
                name="goal-detail"
                options={{
                  animation: 'slide_from_right',
                }}
              />
            </Stack>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <RootLayoutInner />
    </ThemePreferenceProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCard: {
    width: '100%',
    maxWidth: 420,
    padding: 24,
    alignItems: 'center',
  },
  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  errorDescription: {
    textAlign: 'center',
    marginBottom: 12,
  },
  errorDetails: {
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  retryButton: {
    width: '100%',
    marginTop: 8,
  },
});
