import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Implementação iOS de feedback tátil sutil (`expo-haptics`).
 * Todas as chamadas são protegidas com `.catch(() => {})` para não falhar
 * em dispositivos com vibração desativada.
 */
export function hapticTabChange(): void {
  if (Platform.OS !== 'ios') return;
  Haptics.selectionAsync().catch(() => {});
}

export function hapticTransactionSaved(): void {
  if (Platform.OS !== 'ios') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function hapticGoalCompleted(): void {
  if (Platform.OS !== 'ios') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
    () => {}
  );
}

export function hapticBudgetExceeded(): void {
  if (Platform.OS !== 'ios') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
    () => {}
  );
}

export function hapticSwipeAction(): void {
  if (Platform.OS !== 'ios') return;
  Haptics.selectionAsync().catch(() => {});
}
