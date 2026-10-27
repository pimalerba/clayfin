import React from 'react';
import { DynamicColorIOS } from 'react-native';
import { NativeTabs } from 'expo-router/native-tabs';
import { hapticTabChange } from '@/utils/haptics';
import { useAppTheme } from '@/theme';

export const unstable_settings = {
  anchor: 'index',
};

/**
 * Layout de abas nativo para iOS (`UITabBarController` via `NativeTabs`).
 * - No iOS 26+, o próprio sistema aplica Liquid Glass à barra de abas e suporta
 *   `minimizeBehavior="onScrollDown"`.
 * - No iOS 27 / iPhone Duo / janelas redimensionáveis (`sidebarAdaptable`), o sistema
 *   adapta automaticamente a tab bar para uma barra lateral vertical quando apropriado.
 * - Na aba `transactions` (que usa `SectionList` abaixo de cabeçalho e filtros fixos),
 *   usamos `disableTransparentOnScrollEdge` conforme a documentação do Expo Router v58
 *   para garantir aparência consistente da borda de rolagem.
 * - Suporta alternância dinâmica entre modo Claro e Escuro, com blurEffect adaptativo
 *   e cores dinâmicas via `DynamicColorIOS`.
 */
export default function TabsLayoutIOS() {
  const theme = useAppTheme();

  const defaultTint = DynamicColorIOS({
    light: '#5C537E',
    dark: '#B8AFDB',
  });
  const selectedTint = DynamicColorIOS({
    light: '#7E61E3',
    dark: '#9E86F3',
  });
  const selectedLabelTint = DynamicColorIOS({
    light: '#6648CE',
    dark: '#C4B5FD',
  });
  const barBackground = DynamicColorIOS({
    light: '#FBF9FF',
    dark: '#1C162E',
  });

  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      sidebarAdaptable
      screenListeners={{
        tabPress: () => {
          hapticTabChange();
        },
      }}
      tintColor={selectedTint}
      backgroundColor={barBackground}
      blurEffect={theme.isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
      iconColor={{
        default: defaultTint,
        selected: selectedTint,
      }}
      labelStyle={{
        default: {
          color: defaultTint,
          fontFamily: 'Nunito_600SemiBold',
        },
        selected: {
          color: selectedLabelTint,
          fontFamily: 'Nunito_800ExtraBold',
        },
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Início</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'house', selected: 'house.fill' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="transactions"
        disableTransparentOnScrollEdge
      >
        <NativeTabs.Trigger.Label>Transações</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="arrow.left.arrow.right" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="budgets">
        <NativeTabs.Trigger.Label>Orçamento</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'chart.pie', selected: 'chart.pie.fill' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="more">
        <NativeTabs.Trigger.Label>Mais</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'ellipsis.circle', selected: 'ellipsis.circle.fill' }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
