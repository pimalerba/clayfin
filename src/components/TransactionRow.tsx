import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/theme';
import { TransactionWithCategory } from '@/types';
import { formatCentsToBRL } from '@/utils/currency';
import { DynamicIcon } from '@/utils/icons';
import { ClayCard } from '@/components/ui';

export interface TransactionRowProps {
  transaction: TransactionWithCategory;
  onPress?: () => void;
}

export function TransactionRow({ transaction, onPress }: TransactionRowProps) {
  const theme = useAppTheme();
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome
    ? theme.colors.incomeDark
    : theme.colors.expenseDark;
  const sign = isIncome ? '+' : '-';

  return (
    <ClayCard
      radius="lg"
      padding={14}
      onPress={onPress}
      style={styles.card}
      accessibilityLabel={`${transaction.category_name}, ${
        transaction.description || ''
      }, ${isIncome ? 'Receita' : 'Despesa'} de ${formatCentsToBRL(
        transaction.amount_cents
      )}`}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.iconBubble,
            { backgroundColor: `${transaction.category_color}24` },
          ]}
        >
          <DynamicIcon
            name={transaction.category_icon}
            size={20}
            color={transaction.category_color}
          />
        </View>

        <View style={styles.infoCol}>
          <Text
            numberOfLines={1}
            style={[theme.typography.h3, { color: theme.colors.textPrimary }]}
          >
            {transaction.description || transaction.category_name}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              theme.typography.bodySmall,
              { color: theme.colors.textSecondary },
            ]}
          >
            {transaction.category_name}
          </Text>
        </View>

        <Text
          style={[
            theme.typography.h3,
            styles.amount,
            { color: amountColor, fontFamily: theme.fontFamilies.extraBold },
          ]}
        >
          {sign} {formatCentsToBRL(transaction.amount_cents)}
        </Text>
      </View>
    </ClayCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
    paddingRight: 8,
  },
  amount: {
    textAlign: 'right',
  },
});
