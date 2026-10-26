/**
 * Fallback no-op de haptics para Android, Web e ambientes de teste.
 * Nunca importa `expo-haptics` fora do iOS.
 */
export function hapticTabChange(): void {}

export function hapticTransactionSaved(): void {}

export function hapticGoalCompleted(): void {}

export function hapticBudgetExceeded(): void {}

export function hapticSwipeAction(): void {}
