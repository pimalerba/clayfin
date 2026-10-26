import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
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
import { getDatabase } from '@/db';
import { useLiquidGlass } from '@/hooks/useLiquidGlass';
import { useAppTheme } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const theme = useAppTheme();
  const isLiquidGlass = useLiquidGlass();
  const [dbReady, setDbReady] = useState(false);

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

  useEffect(() => {
    let mounted = true;
    getDatabase()
      .then(() => {
        if (mounted) setDbReady(true);
      })
      .catch((err) => {
        console.error('Erro ao inicializar SQLite:', err);
        if (mounted) setDbReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const isAppReady = (fontsLoaded || Boolean(fontError)) && dbReady;

  const navigationTheme = useMemo<Theme>(
    () => ({
      ...DefaultTheme,
      dark: false,
      colors: {
        ...DefaultTheme.colors,
        primary: theme.colors.primary,
        background: '#F2EFFA',
        card: theme.colors.surface,
        text: theme.colors.textPrimary,
        border: theme.colors.border,
        notification: theme.colors.expense,
      },
    }),
    [theme]
  );

  useEffect(() => {
    if (isAppReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isAppReady]);

  if (!isAppReady) {
    return (
      <View
        style={[
          styles.loadingScreen,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={navigationTheme}>
            <StatusBar style="dark" />
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

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
