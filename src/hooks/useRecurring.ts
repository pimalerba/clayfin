import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CreateRecurringRuleInput,
  RecurringRepository,
  UpdateRecurringRuleInput,
} from '@/repositories';
import { queryKeys } from './queryKeys';

export function useRecurringRules() {
  return useQuery({
    queryKey: queryKeys.recurring.list,
    queryFn: () => RecurringRepository.list(),
  });
}

export function useRecurringRuleDetail(id?: string) {
  return useQuery({
    queryKey: queryKeys.recurring.detail(id ?? ''),
    queryFn: () => (id ? RecurringRepository.getById(id) : Promise.resolve(null)),
    enabled: Boolean(id),
  });
}

export function useCreateRecurringRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRecurringRuleInput) =>
      RecurringRepository.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}

export function useCreateRecurringWithFirstOccurrence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      input,
      firstOccurrenceDate,
    }: {
      input: CreateRecurringRuleInput;
      firstOccurrenceDate: string;
    }) =>
      RecurringRepository.createWithFirstOccurrence(input, firstOccurrenceDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}

export function useUpdateRecurringRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateRecurringRuleInput) =>
      RecurringRepository.update(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}

export function useDeleteRecurringRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => RecurringRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}

export function useToggleRecurringRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      RecurringRepository.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all });
    },
  });
}
