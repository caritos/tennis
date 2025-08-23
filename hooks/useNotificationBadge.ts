import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationService } from '@/services/NotificationService';
// import { initializeDatabase } from '@/database/database'; // Removed - using NotificationService from Supabase

export function useNotificationBadge() {
  const { user } = useAuth();
  const [badgeCount, setBadgeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshBadgeCount = useCallback(async () => {
    if (!user?.id) {
      setBadgeCount(0);
      setLoading(false);
      return;
    }

    try {
      const notificationService = new NotificationService();
      const count = await notificationService.getUnreadCount(user.id);
      setBadgeCount(count);
    } catch (error) {
      console.error('Failed to get notification badge count:', error);
      setBadgeCount(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refreshBadgeCount();
  }, [refreshBadgeCount]);

  const incrementBadge = useCallback(() => {
    setBadgeCount(prev => prev + 1);
  }, []);

  const decrementBadge = useCallback(() => {
    setBadgeCount(prev => Math.max(0, prev - 1));
  }, []);

  const clearBadge = useCallback(() => {
    setBadgeCount(0);
  }, []);

  return {
    badgeCount,
    loading,
    refreshBadgeCount,
    incrementBadge,
    decrementBadge,
    clearBadge,
  };
}