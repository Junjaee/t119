// @CODE:NOTIFICATION-001 | SPEC: SPEC-NOTIFICATION-001.md | TAG: TAG-012
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NotificationSettings, NotificationSettingsUpdateInput } from '@/types/notification.types';

interface NotificationSettingsResponse {
  settings: NotificationSettings;
}

export function useNotificationSettings() {
  const queryClient = useQueryClient();
  const queryKey = ['notificationSettings'];

  // Fetch settings
  const query = useQuery<NotificationSettingsResponse>({
    queryKey,
    queryFn: async () => {
      const response = await fetch('/api/notifications/settings');

      if (!response.ok) {
        throw new Error('Failed to fetch notification settings');
      }

      return response.json();
    },
    staleTime: 60000, // 1 minute
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: NotificationSettingsUpdateInput) => {
      const response = await fetch('/api/notifications/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update notification settings');
      }

      return response.json();
    },
    onMutate: async (updates) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<NotificationSettingsResponse>(queryKey);

      if (previousData) {
        queryClient.setQueryData<NotificationSettingsResponse>(queryKey, {
          settings: {
            ...previousData.settings,
            ...updates,
            updated_at: new Date().toISOString(),
          },
        });
      }

      return { previousData };
    },
    onError: (_err, _updates, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    settings: query.data?.settings,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    updateSettings: updateMutation.mutate,
    updateSettingsAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    refetch: query.refetch,
  };
}
