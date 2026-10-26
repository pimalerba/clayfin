import React from 'react';
import { DynamicColorIOS } from 'react-native';
import { NativeTabs } from 'expo-router/native-tabs';

/**
 * Layout de abas nativo para iOS (`UITabBarController` via `NativeTabs`).
 * - No iOS 26+, o próprio sistema aplica Liquid Glass à barra de abas e suporta
 *   `minimizeBehavior="onScrollDown"`.
 * - No iOS 27 / iPhone Duo / janelas redimensionáveis (`sidebarAdaptable`), o sistema
 *   adapta automaticamente a tab bar para uma barra lateral vertical quando apropriado.
 * - Na aba `transactions` (que usa `SectionList` abaixo de cabeçalho e filtros fixos),
 *   usamos `disableTransparentOnScrollEdge` conforme a documentação do Expo Router v58
 *   para garantir aparência consistente da borda de rolagem.
 */
export default function TabsLayoutIOS() {
  const defaultTint = DynamicColorIOS({
    light: '#6B6385',
    dark: '#A69EC0',
  });
  const selectedTint = DynamicColorIOS({
    light: '#7A5AF8',
    dark: '#9B82FA',
  });
  const selectedLabelTint = DynamicColorIOS({
    light: '#5936D6',
    dark: '#B49EFF',
  });
  const barBackground = DynamicColorIOS({
    light: '#FFFFFF',
    dark: '#231E34',
  });

  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      sidebarAdaptable
      tintColor={selectedTint}
      backgroundColor={barBackground}
      blurEffect="systemChromeMaterialLight"
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
