export interface BadgeData {
  count: number;
  type: BadgeType;
  urgency: BadgeUrgency;
  lastUpdated: string;
}

export interface ClubBadgeData {
  clubId: string;
  badges: {
    [key in BadgeType]?: BadgeData;
  };
  totalCount: number;
  highestUrgency: BadgeUrgency;
}

export type BadgeType = 
  | 'challenge_pending'      // New challenges awaiting response
  | 'match_invitation'       // Match invitations awaiting replies
  | 'looking_to_play'        // Looking to Play matches ready to confirm
  | 'unrecorded_match'       // Matches 48+ hours old without scores
  | 'club_admin'             // Club admin notifications
  | 'ranking_update'         // Rankings updated
  | 'new_member';            // New members joined

export type BadgeUrgency = 'low' | 'medium' | 'high' | 'urgent';

export interface BadgeCalculationRule {
  type: BadgeType;
  urgency: BadgeUrgency;
  color: string;
  expiresAfterHours?: number;
  description: string;
}

export const BADGE_RULES: Record<BadgeType, BadgeCalculationRule> = {
  challenge_pending: {
    type: 'challenge_pending',
    urgency: 'high',
    color: '#FF6B35', // Orange-red
    expiresAfterHours: 168, // 7 days
    description: 'Challenges pending your response'
  },
  match_invitation: {
    type: 'match_invitation',
    urgency: 'high',
    color: '#FF6B35', // Orange-red
    expiresAfterHours: 72, // 3 days
    description: 'Match invitations awaiting replies'
  },
  looking_to_play: {
    type: 'looking_to_play',
    urgency: 'medium',
    color: '#FF9500', // Orange
    expiresAfterHours: 24, // 1 day
    description: 'Looking to Play matches ready to confirm'
  },
  unrecorded_match: {
    type: 'unrecorded_match',
    urgency: 'urgent',
    color: '#FF3B30', // Red
    expiresAfterHours: 72, // 3 days after the 48h threshold
    description: 'Matches need score recording'
  },
  club_admin: {
    type: 'club_admin',
    urgency: 'medium',
    color: '#007AFF', // Blue
    description: 'Club admin notifications'
  },
  ranking_update: {
    type: 'ranking_update',
    urgency: 'low',
    color: '#34C759', // Green
    expiresAfterHours: 168, // 7 days
    description: 'Your ranking has been updated'
  },
  new_member: {
    type: 'new_member',
    urgency: 'low',
    color: '#007AFF', // Blue
    expiresAfterHours: 168, // 7 days
    description: 'New members joined the club'
  }
};

export interface BadgeContext {
  userId: string;
  clubId?: string;
  timestamp: string;
}

export interface BadgeStorage {
  totalBadgeCount: number;
  clubBadges: Record<string, ClubBadgeData>;
  lastCalculated: string;
  version: number; // For migration purposes
}

// Helper functions for badge urgency ordering
export const URGENCY_ORDER: Record<BadgeUrgency, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1
};

export function getHighestUrgency(urgencies: BadgeUrgency[]): BadgeUrgency {
  if (urgencies.length === 0) return 'low';
  
  return urgencies.reduce((highest, current) => 
    URGENCY_ORDER[current] > URGENCY_ORDER[highest] ? current : highest
  );
}

export function getBadgeColor(urgency: BadgeUrgency): string {
  switch (urgency) {
    case 'urgent': return '#FF3B30'; // Red
    case 'high': return '#FF6B35';   // Orange-red
    case 'medium': return '#FF9500'; // Orange
    case 'low': return '#007AFF';    // Blue
    default: return '#007AFF';
  }
}