export interface ContextualPromptData {
  id: string;
  type: ContextualPromptType;
  title: string;
  subtitle?: string;
  priority: PromptPriority;
  icon?: string;
  actionButton?: {
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary';
  };
  dismissible?: boolean;
  autoHideAfter?: number; // milliseconds
}

export type ContextualPromptType = 
  | 'welcome_new_user'        // New user with no clubs
  | 'join_first_club'         // User hasn't joined any clubs yet
  | 'record_first_match'      // Member with no recorded matches
  | 'pending_challenges'      // User has pending challenges to respond to
  | 'active_invitations'      // Match invitations waiting for response
  | 'looking_to_play'         // Players looking to play today
  | 'unrecorded_matches'      // Matches that need scores recorded
  | 'ranking_update'          // User's ranking has changed
  | 'achievement_unlock'      // User unlocked an achievement
  | 'club_activity'           // General club activity
  | 'maintenance_mode'        // System maintenance notification
  | 'feature_announcement'    // New feature announcement
  | 'first_club_joined'       // Guide after joining first club
  | 'challenge_someone'       // Encourage sending first challenge
  | 'create_match_invitation' // Encourage creating looking-to-play post
  | 'inactive_club'           // Prompt for quiet club activity
  | 'discover_clubs'          // Enhanced club discovery prompt
  | 'stats_preview';          // Show stats benefits for match recording

export type PromptPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface UserState {
  // User profile data
  isNewUser: boolean;
  hasCompletedOnboarding: boolean;
  registrationDate: Date;
  
  // Club memberships
  clubCount: number;
  joinedClubIds: string[];
  isClubMember: boolean;
  
  // Match activity
  totalMatches: number;
  recentMatches: number; // Last 30 days
  hasRecordedMatch: boolean;
  lastMatchDate?: Date;
  
  // Pending activities
  pendingChallenges: number;
  activeInvitations: number;
  lookingToPlayToday: number;
  unrecordedMatches: number;
  
  // Recent updates
  hasUnreadNotifications: boolean;
  recentRankingChange?: {
    clubId: string;
    oldRank: number;
    newRank: number;
    direction: 'up' | 'down';
  };
  
  // Achievements
  newAchievements: number;
  
  // App usage
  lastActiveDate: Date;
  sessionCount: number;
}

export interface ContextualPromptRule {
  type: ContextualPromptType;
  priority: PromptPriority;
  condition: (state: UserState) => boolean;
  createPrompt: (state: UserState) => Omit<ContextualPromptData, 'id' | 'type' | 'priority'>;
  cooldownHours?: number; // How long to wait before showing again
  maxShowCount?: number; // Maximum times to show this prompt
}

// Prompt generation rules
export const CONTEXTUAL_PROMPT_RULES: ContextualPromptRule[] = [
  // Urgent prompts
  {
    type: 'unrecorded_matches',
    priority: 'urgent',
    condition: (state) => state.unrecordedMatches > 0,
    createPrompt: (state) => ({
      title: `${state.unrecordedMatches} match${state.unrecordedMatches > 1 ? 'es' : ''} need${state.unrecordedMatches === 1 ? 's' : ''} scores recorded`,
      subtitle: 'Record scores to update rankings',
      icon: '📊',
      actionButton: {
        label: 'Record Scores',
        action: () => {}, // Will be set by component
        variant: 'primary'
      },
      dismissible: false
    }),
    cooldownHours: 1,
    maxShowCount: 10
  },

  // High priority prompts
  {
    type: 'pending_challenges',
    priority: 'high',
    condition: (state) => state.pendingChallenges > 0,
    createPrompt: (state) => ({
      title: `You have ${state.pendingChallenges} pending challenge${state.pendingChallenges > 1 ? 's' : ''}`,
      subtitle: 'Respond to keep the game moving',
      icon: '🎾',
      actionButton: {
        label: 'View Challenges',
        action: () => {}, // Will be set by component
        variant: 'primary'
      },
      dismissible: true
    }),
    cooldownHours: 6,
    maxShowCount: 5
  },

  {
    type: 'active_invitations',
    priority: 'high',
    condition: (state) => state.activeInvitations > 0,
    createPrompt: (state) => ({
      title: `${state.activeInvitations} player${state.activeInvitations > 1 ? 's' : ''} looking to play`,
      subtitle: 'Join a match today',
      icon: '🏃‍♂️',
      actionButton: {
        label: 'See Invitations',
        action: () => {}, // Will be set by component
        variant: 'primary'
      },
      dismissible: true
    }),
    cooldownHours: 4,
    maxShowCount: 3
  },

  // Medium priority prompts
  {
    type: 'record_first_match',
    priority: 'medium',
    condition: (state) => state.isClubMember && !state.hasRecordedMatch,
    createPrompt: (state) => ({
      title: 'Ready to play your first match?',
      subtitle: 'Tap a club to find players and record your first game',
      icon: '🚀',
      actionButton: {
        label: 'Find Players',
        action: () => {}, // Will be set by component
        variant: 'secondary'
      },
      dismissible: true
    }),
    cooldownHours: 24,
    maxShowCount: 3
  },

  {
    type: 'ranking_update',
    priority: 'medium',
    condition: (state) => !!state.recentRankingChange,
    createPrompt: (state) => {
      const change = state.recentRankingChange!;
      const emoji = change.direction === 'up' ? '📈' : '📉';
      return {
        title: `${emoji} Your ranking ${change.direction === 'up' ? 'improved' : 'changed'}!`,
        subtitle: `#${change.oldRank} → #${change.newRank}`,
        icon: emoji,
        actionButton: {
          label: 'View Rankings',
          action: () => {}, // Will be set by component
          variant: 'secondary'
        },
        dismissible: true,
        autoHideAfter: 10000
      };
    },
    cooldownHours: 168, // 1 week
    maxShowCount: 1
  },

  // Low priority prompts for new users
  {
    type: 'welcome_new_user',
    priority: 'low',
    condition: (state) => state.isNewUser && !state.isClubMember,
    createPrompt: (state) => ({
      title: 'Welcome to Play Serve! 👋',
      subtitle: 'Join a club to start playing tennis',
      icon: '🎾',
      actionButton: {
        label: 'Explore Clubs',
        action: () => {}, // Will be set by component
        variant: 'primary'
      },
      dismissible: true
    }),
    cooldownHours: 72,
    maxShowCount: 2
  },

  {
    type: 'join_first_club',
    priority: 'low',
    condition: (state) => !state.isNewUser && !state.isClubMember && state.sessionCount > 2,
    createPrompt: (state) => ({
      title: 'Ready to join the tennis community?',
      subtitle: 'Find clubs near you and start playing',
      icon: '🏟️',
      actionButton: {
        label: 'Join a Club',
        action: () => {}, // Will be set by component
        variant: 'secondary'
      },
      dismissible: true
    }),
    cooldownHours: 48,
    maxShowCount: 3
  },

  // New user guidance prompts
  {
    type: 'challenge_someone',
    priority: 'medium',
    condition: (state) => state.isClubMember && state.totalMatches === 0 && state.pendingChallenges === 0,
    createPrompt: (state) => ({
      title: 'Ready to challenge someone?',
      subtitle: 'Send your first challenge to another club member',
      icon: '⚔️',
      actionButton: {
        label: 'Find Players',
        action: () => {}, // Will be set by component
        variant: 'secondary'
      },
      dismissible: true
    }),
    cooldownHours: 24,
    maxShowCount: 3
  },

  {
    type: 'create_match_invitation',
    priority: 'medium',
    condition: (state) => state.isClubMember && state.lookingToPlayToday === 0 && state.totalMatches < 2,
    createPrompt: (state) => ({
      title: 'Looking to play today?',
      subtitle: 'Post a "Looking to Play" invitation to find opponents',
      icon: '📅',
      actionButton: {
        label: 'Create Invitation',
        action: () => {}, // Will be set by component
        variant: 'secondary'
      },
      dismissible: true
    }),
    cooldownHours: 48,
    maxShowCount: 2
  },

  {
    type: 'inactive_club',
    priority: 'low',
    condition: (state) => state.isClubMember && state.recentMatches === 0 && state.sessionCount > 5,
    createPrompt: (state) => ({
      title: 'Club seems quiet lately',
      subtitle: 'Be the first to start some activity!',
      icon: '🌱',
      actionButton: {
        label: 'Start Activity',
        action: () => {}, // Will be set by component
        variant: 'secondary'
      },
      dismissible: true
    }),
    cooldownHours: 168, // 1 week
    maxShowCount: 2
  },

  {
    type: 'stats_preview',
    priority: 'low',
    condition: (state) => state.isClubMember && state.totalMatches > 0 && state.totalMatches < 3,
    createPrompt: (state) => ({
      title: 'Check out your stats!',
      subtitle: 'See your progress and track improvement',
      icon: '📊',
      actionButton: {
        label: 'View Stats',
        action: () => {}, // Will be set by component
        variant: 'secondary'
      },
      dismissible: true
    }),
    cooldownHours: 72,
    maxShowCount: 1
  }
];

// Helper functions
export function getUserState(user: any, clubData: any, matchData: any, notificationData: any): UserState {
  // This will be implemented to gather actual user state
  // For now, return a basic structure
  return {
    isNewUser: false,
    hasCompletedOnboarding: true,
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

export function getHighestPriorityPrompt(prompts: ContextualPromptData[]): ContextualPromptData | null {
  if (prompts.length === 0) return null;
  
  const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
  
  return prompts.reduce((highest, current) => 
    priorityOrder[current.priority] > priorityOrder[highest.priority] ? current : highest
  );
}