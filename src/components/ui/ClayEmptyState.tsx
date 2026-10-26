import React, { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/theme';
import { ClayCard } from './ClayCard';
import { ClayButton } from './ClayButton';

export interface ClayEmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ClayEmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: ClayEmptyStateProps) {
  const theme = useAppTheme();

  return (
    <ClayCard variant="subtle" radius="xl" style={styles.emptyCard}>
      <View style={styles.centerContent}>
        {icon ? (
          <View
            style={[
              styles.iconBubble,
              { backgroundColor: theme.colors.primaryLight },
            ]}
          >
            {icon}
          </View>
        ) : null}
        <Text
          style={[
            theme.typography.h3,
            styles.title,
            { color: theme.colors.textPrimary },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            theme.typography.bodySmall,
            styles.description,
            { color: theme.colors.textSecondary },
          ]}
        >
          {description}
        </Text>
        {actionLabel && onAction ? (
          <ClayButton
            title={actionLabel}
            onPress={onAction}
            size="sm"
            style={styles.actionBtn}
          />
        ) : null}
      </View>
    </ClayCard>
  );
}

export function ClayLoadingState({ message = 'Carregando dados...' }: { message?: string }) {
  const theme = useAppTheme();
  return (
    <ClayCard variant="subtle" style={styles.loadingCard}>
      <View style={styles.loadingRow}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text
          style={[
            theme.typography.body,
            { color: theme.colors.textSecondary, marginLeft: 12 },
          ]}
        >
          {message}
        </Text>
      </View>
    </ClayCard>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    marginVertical: 12,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  iconBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    textAlign: 'center',
    maxWidth: 270,
  },
  actionBtn: {
    marginTop: 14,
  },
  loadingCard: {
    marginVertical: 10,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
});
