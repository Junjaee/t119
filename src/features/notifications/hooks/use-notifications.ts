// @CODE:NOTIFICATION-001 | SPEC: SPEC-NOTIFICATION-001.md | TAG: TAG-011
'use client';

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Notification, NotificationCategory } from '@/types/notification.types';

interface UseNotificationsOptions {
  page?: number;
  limit?: number;
  is_read?: boolean;
  category?: NotificationCategory;
  enableRealtime?: boolean;
}

interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  unread_count: number;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    page = 1,
    limit = 20,
    is_read,
    category,
    enableRealtime = true,
  } = options;

  const queryClient = useQueryClient();
  const supabase = createClient();

  // Query key for caching
  const queryKey = ['notifications', { page, limit, is_read, category }];

  // Fetch notifications
  const query = useQuery<NotificationsResponse>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (is_read !== undefined) {
        params.append('is_read', is_read.toString());
      }

      if (category) {
        params.append('category', category);
      }

      const response = await fetch(`/api/notifications?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      return response.json();
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      return response.json();
    },
    onMutate: async (notificationId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<NotificationsResponse>(queryKey);

      if (previousData) {
        queryClient.setQueryData<NotificationsResponse>(queryKey, {
          ...previousData,
          notifications: previousData.notifications.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n
          ),
          unread_count: Math.max(0, previousData.unread_count - 1),
        });
      }

      return { previousData };
    },
    onError: (_err, _notificationId, context) => {
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

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to mark all as read');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Real-time subscription
  useEffect(() => {
    if (!enableRealtime) return;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            // New notification received - invalidate queries
            queryClient.invalidateQueries({ queryKey: ['notifications'] });

            // Show toast notification (if toast library is available)
            if (typeof window !== 'undefined' && 'Notification' in window) {
              const notification = payload.new as Notification;
              if (Notification.permission === 'granted') {
                new Notification(notification.title, {
                  body: notification.content,
                  icon: '/icon.png',
                });
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            // Notification updated - invalidate queries
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtime();
  }, [enableRealtime, queryClient, supabase]);

  return {
    notifications: query.data?.notifications || [],
    pagination: query.data?.pagination,
    unreadCount: query.data?.unread_count || 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    markAsRead: markAsReadMutation.mutate,
    markAsReadAsync: markAsReadMutation.mutateAsync,
    isMarkingAsRead: markAsReadMutation.isPending,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  };
}
