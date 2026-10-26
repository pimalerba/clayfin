import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BackupRepository } from '@/repositories';
import { ClayfinBackupPayload } from '@/types';
import { queryKeys } from './queryKeys';

export function useOnboardingStatus() {
  return useQuery({
    queryKey: queryKeys.onboarding,
    queryFn: () => BackupRepository.isOnboardingCompleted(),
  });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => BackupRepository.completeOnboarding(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.onboarding });
    },
  });
}

export function useExportBackup() {
  return useMutation({
    mutationFn: () => BackupRepository.exportBackupData(),
  });
}

export function useImportBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ClayfinBackupPayload) =>
      BackupRepository.importBackupData(payload),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

export function useClearAllData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => BackupRepository.clearAllData(),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
