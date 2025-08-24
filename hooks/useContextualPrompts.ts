import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useClubBadges } from './useClubBadges';
import { 
  ContextualPromptData, 
  UserState, 
  CONTEXTUAL_PROMPT_RULES,
  getHighestPriorityPrompt,
  ContextualPromptType
} from '@/types/contextualPrompts';

const PROMPT_STORAGE_KEY = 'contextual_prompts_v1';
const DISMISSED_PROMPTS_KEY = 'dismissed_prompts_v1';

interface PromptStorageData {
  lastShown: Record<ContextualPromptType, string>; // ISO dates
  showCount: Record<ContextualPromptType, number>;
  dismissed: Record<string, string>; // prompt id -> dismissed date
}

export function useContextualPrompts(
  myClubs: any[] = [],
  joinedClubIds: string[] = []
) {
  const { user } = useAuth();
  const { totalBadgeCount, clubBadges } = useClubBadges();
  
  const [currentPrompt, setCurrentPrompt] = useState<ContextualPromptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [promptStorage, setPromptStorage] = useState<PromptStorageData>({
    lastShown: {} as Record<ContextualPromptType, string>,
    showCount: {} as Record<ContextualPromptType, number>,
    dismissed: {}
  });

  // Load prompt storage from AsyncStorage
  const loadPromptStorage = useCallback(async (): Promise<PromptStorageData> => {
    try {
      const stored = await AsyncStorage.getItem(PROMPT_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load prompt storage:', error);
    }

    return {
      lastShown: {} as Record<ContextualPromptType, string>,
      showCount: {} as Record<ContextualPromptType, number>,
      dismissed: {}
    };
  }, []);

  // Save prompt storage to AsyncStorage
  const savePromptStorage = useCallback(async (storage: PromptStorageData) => {
    try {
      await AsyncStorage.setItem(PROMPT_STORAGE_KEY, JSON.stringify(storage));
      setPromptStorage(storage);
    } catch (error) {
      console.error('Failed to save prompt storage:', error);
    }
  }, []);

  // Generate current user state
  const generateUserState = useCallback((): UserState => {
    if (!user) {
      return {
        isNewUser: true,
        hasCompletedOnboarding: false,
        registrationDate: new Date(),
        clubCount: 0,
        joinedClubIds: [],
        isClubMember: false,
        totalMatches: 0,
        recentMatches: 0,
        hasRecordedMatch: false,
        pendingChallenges: 0,
        activeInvitations: 0,
        lookingToPlayToday: 0,
        unrecordedMatches: 0,
        hasUnreadNotifications: false,
        newAchievements: 0,
        lastActiveDate: new Date(),
        sessionCount: 1
      };
    }

    // Calculate user state based on current data
    const now = new Date();
    const registrationDate = new Date(user.created_at || now);
    const daysSinceRegistration = Math.floor((now.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Analyze badge data for pending activities
    let pendingChallenges = 0;
    let activeInvitations = 0;
    let unrecordedMatches = 0;
    
    Object.values(clubBadges).forEach(clubBadge => {
      if (clubBadge.badges.challenge_pending) {
        pendingChallenges += clubBadge.badges.challenge_pending.count;
      }
      if (clubBadge.badges.match_invitation) {
        activeInvitations += clubBadge.badges.match_invitation.count;
      }
      if (clubBadge.badges.unrecorded_match) {
        unrecordedMatches += clubBadge.badges.unrecorded_match.count;
      }
    });

    return {
      isNewUser: daysSinceRegistration < 7, // New user for first week
      hasCompletedOnboarding: true, // Assume true if they're in the app
      registrationDate,
      clubCount: myClubs.length,
      joinedClubIds,
      isClubMember: myClubs.length > 0,
      totalMatches: 0, // TODO: Calculate from match history
      recentMatches: 0, // TODO: Calculate recent matches
      hasRecordedMatch: false, // TODO: Check if user has recorded any matches
      pendingChallenges,
      activeInvitations,
      lookingToPlayToday: 0, // TODO: Calculate from looking-to-play data
      unrecordedMatches,
      hasUnreadNotifications: totalBadgeCount > 0,
      newAchievements: 0, // TODO: Implement achievements
      lastActiveDate: now,
      sessionCount: 1 // TODO: Track session count
    };
  }, [user, myClubs, joinedClubIds, totalBadgeCount, clubBadges]);

  // Check if a prompt should be shown based on cooldown and show count
  const shouldShowPrompt = useCallback((
    type: ContextualPromptType,
    rule: any,
    storage: PromptStorageData
  ): boolean => {
    const now = new Date();
    
    // Check if prompt has been dismissed recently
    const promptId = `${type}_${now.toDateString()}`;
    if (storage.dismissed[promptId]) {
      return false;
    }

    // Check cooldown
    if (rule.cooldownHours && storage.lastShown[type]) {
      const lastShown = new Date(storage.lastShown[type]);
      const hoursSinceLastShown = (now.getTime() - lastShown.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastShown < rule.cooldownHours) {
        return false;
      }
    }

    // Check max show count
    if (rule.maxShowCount && (storage.showCount[type] || 0) >= rule.maxShowCount) {
      return false;
    }

    return true;
  }, []);

  // Generate all applicable prompts
  const generatePrompts = useCallback(async (): Promise<ContextualPromptData[]> => {
    const userState = generateUserState();
    const storage = await loadPromptStorage();
    const prompts: ContextualPromptData[] = [];

    for (const rule of CONTEXTUAL_PROMPT_RULES) {
      if (rule.condition(userState) && shouldShowPrompt(rule.type, rule, storage)) {
        const promptData = rule.createPrompt(userState);
        
        // Add action handlers
        const prompt: ContextualPromptData = {
          id: `${rule.type}_${Date.now()}`,
          type: rule.type,
          priority: rule.priority,
          ...promptData,
          actionButton: promptData.actionButton ? {
            ...promptData.actionButton,
            action: () => handlePromptAction(rule.type)
          } : undefined
        };

        prompts.push(prompt);
      }
    }

    return prompts;
  }, [generateUserState, loadPromptStorage, shouldShowPrompt]);

  // Handle prompt action button clicks
  const handlePromptAction = useCallback((type: ContextualPromptType) => {
    switch (type) {
      case 'pending_challenges':
        router.push('/notifications');
        break;
      case 'active_invitations':
        router.push('/notifications');
        break;
      case 'unrecorded_matches':
        router.push('/record-match');
        break;
      case 'record_first_match':
        // Navigate to first club or club discovery
        if (myClubs.length > 0) {
          router.push(`/club/${myClubs[0].id}`);
        } else {
          // Scroll to discover clubs section
        }
        break;
      case 'welcome_new_user':
      case 'join_first_club':
        // Scroll to discover clubs section or navigate to club discovery
        break;
      case 'ranking_update':
        if (myClubs.length > 0) {
          router.push(`/club/${myClubs[0].id}`);
        }
        break;
      default:
        console.log('No action defined for prompt type:', type);
    }
  }, [myClubs]);

  // Dismiss current prompt
  const dismissPrompt = useCallback(async (promptId: string) => {
    if (!currentPrompt) return;

    const now = new Date();
    const newStorage = {
      ...promptStorage,
      dismissed: {
        ...promptStorage.dismissed,
        [promptId]: now.toISOString()
      }
    };

    await savePromptStorage(newStorage);
    setCurrentPrompt(null);
  }, [currentPrompt, promptStorage, savePromptStorage]);

  // Mark prompt as shown (for analytics and cooldown)
  const markPromptShown = useCallback(async (type: ContextualPromptType) => {
    try {
      // Load fresh storage to avoid stale state
      const currentStorage = await loadPromptStorage();
      const now = new Date();
      const newStorage = {
        ...currentStorage,
        lastShown: {
          ...currentStorage.lastShown,
          [type]: now.toISOString()
        },
        showCount: {
          ...currentStorage.showCount,
          [type]: (currentStorage.showCount[type] || 0) + 1
        }
      };

      // Save directly to AsyncStorage without triggering state updates
      await AsyncStorage.setItem(PROMPT_STORAGE_KEY, JSON.stringify(newStorage));
      
      // Update local state last to prevent loops
      setPromptStorage(newStorage);
    } catch (error) {
      console.error('Failed to mark prompt as shown:', error);
    }
  }, [loadPromptStorage]);

  // Refresh prompts
  const refreshPrompts = useCallback(async () => {
    try {
      setLoading(true);
      const prompts = await generatePrompts();
      const highestPriorityPrompt = getHighestPriorityPrompt(prompts);
      
      if (highestPriorityPrompt) {
        setCurrentPrompt(prevPrompt => {
          // Only update if it's a different prompt
          if (prevPrompt?.id !== highestPriorityPrompt.id) {
            // Mark as shown without depending on the callback
            markPromptShown(highestPriorityPrompt.type).catch(console.error);
            return highestPriorityPrompt;
          }
          return prevPrompt;
        });
      } else {
        setCurrentPrompt(null);
      }
    } catch (error) {
      console.error('Failed to refresh prompts:', error);
    } finally {
      setLoading(false);
    }
  }, [generatePrompts, markPromptShown]);

  // Initialize and refresh on dependency changes
  useEffect(() => {
    if (user) {
      refreshPrompts();
    } else {
      setCurrentPrompt(null);
      setLoading(false);
    }
  }, [user, myClubs.length, joinedClubIds.length, totalBadgeCount, refreshPrompts]);

  // Auto-hide prompts with autoHideAfter
  useEffect(() => {
    if (currentPrompt?.autoHideAfter) {
      const timer = setTimeout(() => {
        setCurrentPrompt(null);
      }, currentPrompt.autoHideAfter);

      return () => clearTimeout(timer);
    }
  }, [currentPrompt]);

  return {
    currentPrompt,
    loading,
    dismissPrompt,
    refreshPrompts,
    // For testing
    generateUserState: __DEV__ ? generateUserState : undefined
  };
}