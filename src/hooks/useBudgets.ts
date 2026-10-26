import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BudgetRepository, UpsertBudgetInput } from '@/repositories';
import { queryKeys } from './queryKeys';

export function useBudgets(month: string) {
  return useQuery({
    queryKey: queryKeys.budgets.byMonth(month),
    queryFn: () => BudgetRepository.getByMonthWithUsage(month),
  });
}

export function useUpsertBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpsertBudgetInput) => BudgetRepository.upsert(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => BudgetRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all });
    },
  });
}
