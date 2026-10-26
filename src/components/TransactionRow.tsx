import React from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Edit3, Trash2 } from 'lucide-react-native';
import { useAppTheme } from '@/theme';
import { TransactionWithCategory } from '@/types';
import { formatCentsToBRL } from '@/utils/currency';
import { hapticSwipeAction } from '@/utils/haptics';
import { DynamicIcon } from '@/utils/icons';
import { ClayCard } from '@/components/ui';

export interface TransactionRowProps {
  transaction: TransactionWithCategory;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TransactionRow({
  transaction,
  onPress,
  onEdit,
  onDelete,
}: TransactionRowProps) {
  const theme = useAppTheme();
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome
    ? theme.colors.incomeDark
    : theme.colors.expenseDark;
  const sign = isIncome ? '+' : '-';

  const handleEditAction = (swipeableMethods: SwipeableMethods) => {
    swipeableMethods.close();
    if (onEdit) {
      onEdit();
    } else {
      onPress?.();
    }
  };

  const handleDeleteAction = (swipeableMethods: SwipeableMethods) => {
    swipeableMethods.close();
    if (!onDelete) return;
    Alert.alert(
      'Excluir transação',
      'Deseja realmente excluir esta transação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => onDelete(),
        },
      ]
    );
  };

  const cardElement = (
    <ClayCard
      radius="lg"
      padding={14}
      onPress={onPress}
      style={Platform.OS === 'ios' ? undefined : styles.card}
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
            maxFontSizeMultiplier={1.8}
            style={[theme.typography.h3, { color: theme.colors.textPrimary }]}
          >
            {transaction.description || transaction.category_name}
          </Text>
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={1.8}
            style={[
              theme.typography.bodySmall,
              { color: theme.colors.textSecondary },
            ]}
          >
            {transaction.category_name}
          </Text>
        </View>

        <Text
          maxFontSizeMultiplier={2.0}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          numberOfLines={1}
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

  if (Platform.OS !== 'ios') {
    return cardElement;
  }

  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      containerStyle={styles.swipeContainer}
      onSwipeableWillOpen={() => {
        hapticSwipeAction();
      }}
      renderRightActions={(_progress, _translation, swipeableMethods) => (
        <View style={styles.rightActionsRow}>
          <Pressable
            onPress={() => handleEditAction(swipeableMethods)}
            accessibilityRole="button"
            accessibilityLabel="Editar transação"
            style={[
              styles.swipeActionBtn,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.radii.lg,
              },
            ]}
          >
            <Edit3 size={18} color="#FFFFFF" strokeWidth={2.4} />
            <Text
              style={[
                theme.typography.caption,
                styles.swipeActionLabel,
                { fontFamily: theme.fontFamilies.bold },
              ]}
            >
              Editar
            </Text>
          </Pressable>

          {onDelete ? (
            <Pressable
              onPress={() => handleDeleteAction(swipeableMethods)}
              accessibilityRole="button"
              accessibilityLabel="Excluir transação"
              style={[
                styles.swipeActionBtn,
                {
                  backgroundColor: theme.colors.expense,
                  borderRadius: theme.radii.lg,
                },
              ]}
            >
              <Trash2 size={18} color="#FFFFFF" strokeWidth={2.4} />
              <Text
                style={[
                  theme.typography.caption,
                  styles.swipeActionLabel,
                  { fontFamily: theme.fontFamilies.bold },
                ]}
              >
                Excluir
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}
    >
      {cardElement}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
  },
  swipeContainer: {
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
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    marginLeft: 10,
  },
  swipeActionBtn: {
    width: 74,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  swipeActionLabel: {
    color: '#FFFFFF',
    marginTop: 4,
  },
});
