import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DownloadCloud,
  PiggyBank,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';
import { useAppTheme } from '@/theme';
import { useCompleteOnboarding, useWindowClass } from '@/hooks';
import { ClayButton, ClayCard } from '@/components/ui';

const SLIDES = [
  {
    title: 'Bem-vindo ao Clayfin',
    subtitle:
      'Seu controle de finanças pessoais minimalista, macio e simples de usar todos os dias.',
    icon: Sparkles,
    badge: 'Simples & Rápido',
  },
  {
    title: '100% Offline no seu Aparelho',
    subtitle:
      'Sem login, sem conta e sem servidores externos. Todos os seus centavos ficam salvos localmente com total privacidade.',
    icon: ShieldCheck,
    badge: 'Privacidade Total',
  },
  {
    title: 'Faça Backups Regulares',
    subtitle:
      'Como os dados vivem apenas no seu celular, use a opção "Exportar Backup" em Configurações para salvar uma cópia segura sempre que quiser.',
    icon: DownloadCloud,
    badge: 'Dica Importante',
  },
];

export default function OnboardingScreen() {
  const theme = useAppTheme();
  const { maxFormWidth } = useWindowClass();
  const [stepIndex, setStepIndex] = useState(0);
  const completeMutation = useCompleteOnboarding();

  const currentSlide = SLIDES[stepIndex];
  const IconComponent = currentSlide.icon;
  const isLast = stepIndex === SLIDES.length - 1;

  const handleNext = async () => {
    if (!isLast) {
      setStepIndex((prev) => prev + 1);
      return;
    }
    await completeMutation.mutateAsync();
    router.replace('/(tabs)');
  };

  const handleSkip = async () => {
    await completeMutation.mutateAsync();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.container,
          maxFormWidth
            ? { maxWidth: maxFormWidth, width: '100%', alignSelf: 'center' }
            : null,
        ]}
      >
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <PiggyBank size={22} color={theme.colors.primary} />
            <Text
              style={[
                theme.typography.h3,
                { color: theme.colors.primary, marginLeft: 8 },
              ]}
            >
              Clayfin
            </Text>
          </View>
          {!isLast ? (
            <ClayButton
              title="Pular"
              variant="ghost"
              size="sm"
              onPress={handleSkip}
            />
          ) : null}
        </View>

        <View style={styles.centerArea}>
          <ClayCard radius="xxl" padding={28} style={styles.slideCard}>
            {stepIndex === 0 ? (
              <View style={styles.logoWrapper}>
                <Image
                  source={require('../../assets/images/logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                  accessibilityLabel="Logo do Clayfin"
                  accessible
                />
              </View>
            ) : (
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: theme.colors.primaryLight },
                ]}
              >
                <IconComponent size={46} color={theme.colors.primary} />
              </View>
            )}

            <View
              style={[
                styles.badgePill,
                { backgroundColor: theme.colors.secondaryLight },
              ]}
            >
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.isDark ? theme.colors.primary : theme.colors.primaryDark },
                ]}
              >
                {currentSlide.badge}
              </Text>
            </View>

            <Text
              style={[
                theme.typography.h1,
                styles.title,
                { color: theme.colors.textPrimary },
              ]}
            >
              {currentSlide.title}
            </Text>

            <Text
              style={[
                theme.typography.body,
                styles.subtitle,
                { color: theme.colors.textSecondary },
              ]}
            >
              {currentSlide.subtitle}
            </Text>
          </ClayCard>

          <View style={styles.dotsRow}>
            {SLIDES.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  {
                    width: idx === stepIndex ? 26 : 10,
                    backgroundColor:
                      idx === stepIndex
                        ? theme.colors.primary
                        : theme.colors.primaryLight,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <ClayButton
            title={isLast ? 'Começar a Usar o Clayfin' : 'Próximo'}
            onPress={handleNext}
            loading={completeMutation.isPending}
            size="lg"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerArea: {
    alignItems: 'center',
  },
  slideCard: {
    width: '100%',
    alignItems: 'center',
  },
  logoWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  logoImage: {
    width: 140,
    height: 140,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  badgePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 14,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  dot: {
    height: 10,
    borderRadius: 5,
  },
  footer: {
    paddingBottom: 12,
  },
});
