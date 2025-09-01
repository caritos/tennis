import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationService } from '@/services/NotificationService';
import { supabase } from '@/lib/supabase';

export const useNotificationCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let notificationService: NotificationService;
    let subscription: any = null;

    const initializeService = async () => {
      try {
        notificationService = new NotificationService();
        
        // Load initial count
        await loadUnreadCount();
        
        // Set up realtime subscription for notification changes instead of polling
        if (user?.id) {
          console.log('🔔 Setting up realtime subscription for notification count');
          subscription = supabase
            .channel(`notifications_count_${user.id}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
              },
              (payload) => {
                console.log('🔔 Notification change detected, refreshing count:', payload.eventType);
                loadUnreadCount();
              }
            )
            .subscribe((status) => {
              console.log(`📡 Notification count subscription status: ${status}`);
            });
        }
      } catch (error) {
        console.error('Failed to initialize notification service:', error);
        setLoading(false);
      }
    };

    const loadUnreadCount = async () => {
      if (!notificationService || !user?.id) {
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      try {
        const count = await notificationService.getUnreadCount(user.id);
        setUnreadCount(count);
      } catch (error) {
        console.error('Failed to load unread count:', error);
        setUnreadCount(0);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      initializeService();
    } else {
      setUnreadCount(0);
      setLoading(false);
    }

    return () => {
      if (subscription) {
        console.log('🧹 Cleaning up notification count subscription');
        subscription.unsubscribe();
      }
    };
  }, [user?.id]);

  const refreshCount = async () => {
    if (!user?.id) return;
    
    try {
      const notificationService = new NotificationService();
      const count = await notificationService.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to refresh notification count:', error);
    }
  };

  return {
    unreadCount,
    loading,
    refreshCount,
  };
};