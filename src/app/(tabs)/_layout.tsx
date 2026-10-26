import React from 'react';
import { Tabs } from 'expo-router';
import { ClayTabBar } from '@/components/ui';
import { useAppTheme } from '@/theme';

export default function TabsLayout() {
  const theme = useAppTheme();

  return (
    <Tabs
      tabBar={(props) => <ClayTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transações',
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Orçamento',
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Mais',
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Metas',
          href: null,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Relatórios',
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          href: null,
        }}
      />
    </Tabs>
  );
}
