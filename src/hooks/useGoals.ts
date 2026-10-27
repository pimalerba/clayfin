import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AddContributionInput,
  CreateGoalInput,
  GoalRepository,
  UpdateGoalInput,
} from '@/repositories';
import { queryKeys } from './queryKeys';

export function useGoals() {
  return useQuery({
    queryKey: queryKeys.goals.all,
    queryFn: () => GoalRepository.getAllWithProgress(),
  });
}

export function useGoalDetail(id?: string) {
  return useQuery({
    queryKey: queryKeys.goals.detail(id ?? ''),
    queryFn: () =>
      id ? GoalRepository.getByIdWithProgress(id) : Promise.resolve(null),
    enabled: Boolean(id),
  });
}

export function useGoalContributions(goalId?: string) {
  return useQuery({
    queryKey: queryKeys.goals.contributions(goalId ?? ''),
    queryFn: () =>
      goalId ? GoalRepository.getContributions(goalId) : Promise.resolve([]),
    enabled: Boolean(goalId),
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGoalInput) => GoalRepository.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateGoalInput) => GoalRepository.update(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.goals.detail(variables.id),
      });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => GoalRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
  });
}

export function useAddGoalContribution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddContributionInput) =>
      GoalRepository.addContribution(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.goals.detail(variables.goal_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.goals.contributions(variables.goal_id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
  });
}

export function useDeleteGoalContribution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; goalId: string }) =>
      GoalRepository.deleteContribution(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.goals.detail(variables.goalId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.goals.contributions(variables.goalId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
  });
}
