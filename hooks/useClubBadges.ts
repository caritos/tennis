import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BadgeService } from '@/services/BadgeService';
import { ClubBadgeData, BadgeStorage } from '@/types/badges';
import { initializeDatabase } from '@/database/database';

export function useClubBadges() {
  const { user } = useAuth();
  const [totalBadgeCount, setTotalBadgeCount] = useState(0);
  const [clubBadges, setClubBadges] = useState<Record<string, ClubBadgeData>>({});
  const [loading, setLoading] = useState(true);
  const [badgeService, setBadgeService] = useState<BadgeService | null>(null);

  // Initialize badge service
  useEffect(() => {
    const initBadgeService = async () => {
      try {
        const db = await initializeDatabase();
        setBadgeService(new BadgeService(db));
      } catch (error) {
        console.error('Failed to initialize badge service:', error);
      }
    };

    initBadgeService();
  }, []);

  // Refresh all badge data
  const refreshBadges = useCallback(async (forceRefresh: boolean = false) => {
    if (!user?.id || !badgeService) {
      setTotalBadgeCount(0);
      setClubBadges({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      let storage: BadgeStorage;
      if (forceRefresh) {
        storage = await badgeService.refreshBadges(user.id);
      } else {
        const totalCount = await badgeService.getTotalBadgeCount(user.id);
        const allClubBadges = await badgeService.getAllClubBadges(user.id);
        
        storage = {
          totalBadgeCount: totalCount,
          clubBadges: allClubBadges,
          lastCalculated: new Date().toISOString(),
          version: 1
        };
      }

      setTotalBadgeCount(storage.totalBadgeCount);
      setClubBadges(storage.clubBadges);
      
    } catch (error) {
      console.error('Failed to refresh badges:', error);
      setTotalBadgeCount(0);
      setClubBadges({});
    } finally {
      setLoading(false);
    }
  }, [user?.id, badgeService]);

  // Get badge data for a specific club
  const getClubBadgeData = useCallback((clubId: string): ClubBadgeData | null => {
    return clubBadges[clubId] || null;
  }, [clubBadges]);

  // Get badge count for a specific club
  const getClubBadgeCount = useCallback((clubId: string): number => {
    const clubBadgeData = clubBadges[clubId];
    return clubBadgeData?.totalCount || 0;
  }, [clubBadges]);

  // Check if a club has urgent badges
  const hasUrgentBadges = useCallback((clubId: string): boolean => {
    const clubBadgeData = clubBadges[clubId];
    return clubBadgeData?.highestUrgency === 'urgent';
  }, [clubBadges]);

  // Get color for club badge based on urgency
  const getClubBadgeColor = useCallback((clubId: string): string => {
    const clubBadgeData = clubBadges[clubId];
    if (!clubBadgeData || clubBadgeData.totalCount === 0) {
      return '#007AFF'; // Default blue
    }

    switch (clubBadgeData.highestUrgency) {
      case 'urgent': return '#FF3B30'; // Red
      case 'high': return '#FF6B35';   // Orange-red
      case 'medium': return '#FF9500'; // Orange
      case 'low': return '#007AFF';    // Blue
      default: return '#007AFF';
    }
  }, [clubBadges]);

  // Manual increment/decrement for optimistic UI updates
  const incrementClubBadge = useCallback((clubId: string, amount: number = 1) => {
    setTotalBadgeCount(prev => prev + amount);
    setClubBadges(prev => {
      const existing = prev[clubId];
      if (!existing) return prev;
      
      return {
        ...prev,
        [clubId]: {
          ...existing,
          totalCount: existing.totalCount + amount
        }
      };
    });
  }, []);

  const decrementClubBadge = useCallback((clubId: string, amount: number = 1) => {
    setTotalBadgeCount(prev => Math.max(0, prev - amount));
    setClubBadges(prev => {
      const existing = prev[clubId];
      if (!existing) return prev;
      
      const newCount = Math.max(0, existing.totalCount - amount);
      if (newCount === 0) {
        const { [clubId]: removed, ...rest } = prev;
        return rest;
      }
      
      return {
        ...prev,
        [clubId]: {
          ...existing,
          totalCount: newCount
        }
      };
    });
  }, []);

  // Clear all badges (useful after marking all as read)
  const clearAllBadges = useCallback(async () => {
    if (!user?.id || !badgeService) return;
    
    try {
      await badgeService.clearBadgeCache(user.id);
      setTotalBadgeCount(0);
      setClubBadges({});
    } catch (error) {
      console.error('Failed to clear all badges:', error);
    }
  }, [user?.id, badgeService]);

  // Initial load and refresh on user change
  useEffect(() => {
    refreshBadges();
  }, [refreshBadges]);

  return {
    // Data
    totalBadgeCount,
    clubBadges,
    loading,
    
    // Club-specific getters
    getClubBadgeData,
    getClubBadgeCount,
    getClubBadgeColor,
    hasUrgentBadges,
    
    // Actions
    refreshBadges,
    incrementClubBadge,
    decrementClubBadge,
    clearAllBadges,
    
    // Force refresh
    forceRefresh: () => refreshBadges(true)
  };
}

// Simplified hook for just total count (for tab badge)
export function useTotalBadgeCount() {
  const { totalBadgeCount, loading, refreshBadges } = useClubBadges();
  
  return {
    badgeCount: totalBadgeCount,
    loading,
    refresh: refreshBadges
  };
}