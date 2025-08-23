import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationService } from '@/services/NotificationService';
// import { initializeDatabase } from '@/database/database'; // Removed - using NotificationService from Supabase

export const useNotificationCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let notificationService: NotificationService;
    let intervalId: NodeJS.Timeout;

    const initializeService = async () => {
      try {
        notificationService = new NotificationService();
        
        // Load initial count
        await loadUnreadCount();
        
        // Poll for updates every 30 seconds
        intervalId = setInterval(loadUnreadCount, 30000);
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
      if (intervalId) {
        clearInterval(intervalId);
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