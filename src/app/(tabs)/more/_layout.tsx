import React from 'react';
import { Stack } from 'expo-router';
import { useAppTheme } from '@/theme';

export const unstable_settings = {
  anchor: 'index',
};

export default function MoreStackLayout() {
  const theme = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="recurring" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
