export type BudgetAlertLevel = 'normal' | 'warning' | 'exceeded';

export interface BudgetProgressResult {
  percentage: number;
  clampedPercentage: number;
  remainingCents: number;
  alertLevel: BudgetAlertLevel;
  isOver80: boolean;
  isOver100: boolean;
}

/**
 * Calcula o progresso do orçamento mensal (gasto vs. limite em centavos).
 * Alerta visual quando >= 80% ('warning') e >= 100% ('exceeded').
 */
export function calculateBudgetProgress(
  spentCents: number,
  limitCents: number
): BudgetProgressResult {
  const safeSpent = Math.max(0, Math.trunc(spentCents || 0));
  const safeLimit = Math.max(0, Math.trunc(limitCents || 0));

  if (safeLimit <= 0) {
    return {
      percentage: safeSpent > 0 ? 100 : 0,
      clampedPercentage: safeSpent > 0 ? 100 : 0,
      remainingCents: -safeSpent,
      alertLevel: safeSpent > 0 ? 'exceeded' : 'normal',
      isOver80: safeSpent > 0,
      isOver100: safeSpent > 0,
    };
  }

  const rawPercentage = (safeSpent / safeLimit) * 100;
  const percentage = Math.round(rawPercentage * 10) / 10;
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const remainingCents = safeLimit - safeSpent;

  let alertLevel: BudgetAlertLevel = 'normal';
  if (rawPercentage >= 100) {
    alertLevel = 'exceeded';
  } else if (rawPercentage >= 80) {
    alertLevel = 'warning';
  }

  return {
    percentage,
    clampedPercentage,
    remainingCents,
    alertLevel,
    isOver80: rawPercentage >= 80,
    isOver100: rawPercentage >= 100,
  };
}

export interface GoalProgressResult {
  currentCents: number;
  targetCents: number;
  remainingCents: number;
  percentage: number;
  clampedPercentage: number;
  isCompleted: boolean;
}

/**
 * Calcula o progresso de uma meta / cofrinho em centavos.
 */
export function calculateGoalProgress(
  currentCents: number,
  targetCents: number
): GoalProgressResult {
  const safeCurrent = Math.max(0, Math.trunc(currentCents || 0));
  const safeTarget = Math.max(0, Math.trunc(targetCents || 0));

  if (safeTarget <= 0) {
    return {
      currentCents: safeCurrent,
      targetCents: safeTarget,
      remainingCents: 0,
      percentage: safeCurrent > 0 ? 100 : 0,
      clampedPercentage: safeCurrent > 0 ? 100 : 0,
      isCompleted: safeCurrent > 0,
    };
  }

  const rawPercentage = (safeCurrent / safeTarget) * 100;
  const percentage = Math.round(rawPercentage * 10) / 10;
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const remainingCents = Math.max(0, safeTarget - safeCurrent);

  return {
    currentCents: safeCurrent,
    targetCents: safeTarget,
    remainingCents,
    percentage,
    clampedPercentage,
    isCompleted: safeCurrent >= safeTarget,
  };
}
