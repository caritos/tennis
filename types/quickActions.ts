export interface QuickActionItem {
  id: string;
  type: QuickActionType;
  title: string;
  subtitle?: string;
  description?: string;
  clubId: string;
  clubName: string;
  urgency: ActionUrgency;
  createdAt: string;
  expiresAt?: string;
  metadata: ActionMetadata;
  actions: QuickActionButton[];
}

export type QuickActionType = 
  | 'challenge_received'      // Challenge you need to accept/decline
  | 'challenge_sent'          // Challenge you sent (for status updates)
  | 'match_invitation'        // Match invitation needing response
  | 'looking_to_play'         // Looking to play match you can join
  | 'unrecorded_match'        // Match you played that needs score recording
  | 'club_join_request'       // Join request for your club (if admin)
  | 'match_confirmation'      // Match that needs final confirmation
  | 'challenge_expired'       // Challenge that expired (info only)
  | 'ranking_change';         // Ranking change notification

export type ActionUrgency = 'low' | 'medium' | 'high' | 'urgent';

export interface ActionMetadata {
  // Challenge metadata
  challengeId?: string;
  challengerName?: string;
  challengerId?: string;
  matchType?: 'singles' | 'doubles';
  proposedDate?: string;
  
  // Match metadata
  matchId?: string;
  matchDate?: string;
  opponentName?: string;
  opponentId?: string;
  courtNumber?: string;
  
  // Looking to play metadata
  lookingToPlayId?: string;
  creatorName?: string;
  creatorId?: string;
  playersNeeded?: number;
  currentPlayers?: number;
  
  // Club metadata
  joinRequestId?: string;
  requesterName?: string;
  requesterId?: string;
  
  // Ranking metadata
  oldRank?: number;
  newRank?: number;
  rankingType?: string;
}

export interface QuickActionButton {
  id: string;
  label: string;
  variant: 'primary' | 'secondary' | 'danger' | 'success';
  action: QuickActionButtonType;
  confirmationRequired?: boolean;
  confirmationMessage?: string;
}

export type QuickActionButtonType = 
  | 'accept_challenge'
  | 'decline_challenge'
  | 'join_match'
  | 'record_score'
  | 'approve_join_request'
  | 'deny_join_request'
  | 'confirm_match'
  | 'cancel_match'
  | 'view_details'
  | 'dismiss';

export interface QuickActionsState {
  items: QuickActionItem[];
  totalCount: number;
  highestUrgency: ActionUrgency;
  lastUpdated: string;
  isCollapsed: boolean;
  loading: boolean;
}

export interface QuickActionsSummary {
  challenges: number;
  matchInvitations: number;
  lookingToPlay: number;
  unrecordedMatches: number;
  clubRequests: number;
  total: number;
  urgentCount: number;
}

// Quick action generation rules
export interface QuickActionRule {
  type: QuickActionType;
  priority: number; // Higher number = higher priority
  maxAge: number; // Maximum age in hours before auto-dismissing
  generateItem: (data: any) => QuickActionItem;
}

export const QUICK_ACTION_RULES: QuickActionRule[] = [
  // Challenge received - highest priority
  {
    type: 'challenge_received',
    priority: 10,
    maxAge: 168, // 7 days
    generateItem: (challenge: any): QuickActionItem => ({
      id: `challenge_received_${challenge.id}`,
      type: 'challenge_received',
      title: `Challenge from ${challenge.challengerName}`,
      subtitle: `${challenge.matchType} • ${formatDate(challenge.proposedDate)}`,
      clubId: challenge.clubId,
      clubName: challenge.clubName,
      urgency: 'high',
      createdAt: challenge.createdAt,
      expiresAt: challenge.expiresAt,
      metadata: {
        challengeId: challenge.id,
        challengerName: challenge.challengerName,
        challengerId: challenge.challengerId,
        matchType: challenge.matchType,
        proposedDate: challenge.proposedDate
      },
      actions: [
        {
          id: 'accept',
          label: 'Accept',
          variant: 'success',
          action: 'accept_challenge'
        },
        {
          id: 'decline',
          label: 'Decline',
          variant: 'secondary',
          action: 'decline_challenge'
        }
      ]
    })
  },

  // Unrecorded match - urgent priority
  {
    type: 'unrecorded_match',
    priority: 9,
    maxAge: 120, // 5 days
    generateItem: (match: any): QuickActionItem => ({
      id: `unrecorded_match_${match.id}`,
      type: 'unrecorded_match',
      title: 'Match score needed',
      subtitle: `vs ${match.opponentName} • ${formatDate(match.matchDate)}`,
      description: 'Record the score to update rankings',
      clubId: match.clubId,
      clubName: match.clubName,
      urgency: 'urgent',
      createdAt: match.createdAt,
      metadata: {
        matchId: match.id,
        matchDate: match.matchDate,
        opponentName: match.opponentName,
        opponentId: match.opponentId
      },
      actions: [
        {
          id: 'record',
          label: 'Record Score',
          variant: 'primary',
          action: 'record_score'
        },
        {
          id: 'view',
          label: 'View Match',
          variant: 'secondary',
          action: 'view_details'
        }
      ]
    })
  },

  // Match invitation
  {
    type: 'match_invitation',
    priority: 8,
    maxAge: 72, // 3 days
    generateItem: (invitation: any): QuickActionItem => ({
      id: `match_invitation_${invitation.id}`,
      type: 'match_invitation',
      title: `Match invitation from ${invitation.creatorName}`,
      subtitle: `${invitation.matchType} • ${formatDate(invitation.matchDate)}`,
      clubId: invitation.clubId,
      clubName: invitation.clubName,
      urgency: 'high',
      createdAt: invitation.createdAt,
      expiresAt: invitation.expiresAt,
      metadata: {
        matchId: invitation.id,
        matchDate: invitation.matchDate,
        creatorName: invitation.creatorName,
        creatorId: invitation.creatorId,
        matchType: invitation.matchType
      },
      actions: [
        {
          id: 'join',
          label: 'Join Match',
          variant: 'success',
          action: 'join_match'
        },
        {
          id: 'decline',
          label: 'Pass',
          variant: 'secondary',
          action: 'dismiss'
        }
      ]
    })
  },

  // Looking to play
  {
    type: 'looking_to_play',
    priority: 7,
    maxAge: 24, // 1 day
    generateItem: (lookingToPlay: any): QuickActionItem => ({
      id: `looking_to_play_${lookingToPlay.id}`,
      type: 'looking_to_play',
      title: `${lookingToPlay.creatorName} is looking to play`,
      subtitle: `${lookingToPlay.playersNeeded - lookingToPlay.currentPlayers} spot${lookingToPlay.playersNeeded - lookingToPlay.currentPlayers > 1 ? 's' : ''} left`,
      clubId: lookingToPlay.clubId,
      clubName: lookingToPlay.clubName,
      urgency: 'medium',
      createdAt: lookingToPlay.createdAt,
      metadata: {
        lookingToPlayId: lookingToPlay.id,
        creatorName: lookingToPlay.creatorName,
        creatorId: lookingToPlay.creatorId,
        playersNeeded: lookingToPlay.playersNeeded,
        currentPlayers: lookingToPlay.currentPlayers
      },
      actions: [
        {
          id: 'join',
          label: 'Join',
          variant: 'primary',
          action: 'join_match'
        },
        {
          id: 'view',
          label: 'Details',
          variant: 'secondary',
          action: 'view_details'
        }
      ]
    })
  },

  // Club join request (for admins)
  {
    type: 'club_join_request',
    priority: 6,
    maxAge: 168, // 7 days
    generateItem: (request: any): QuickActionItem => ({
      id: `club_join_request_${request.id}`,
      type: 'club_join_request',
      title: `Join request from ${request.requesterName}`,
      subtitle: 'New member wants to join your club',
      clubId: request.clubId,
      clubName: request.clubName,
      urgency: 'medium',
      createdAt: request.createdAt,
      metadata: {
        joinRequestId: request.id,
        requesterName: request.requesterName,
        requesterId: request.requesterId
      },
      actions: [
        {
          id: 'approve',
          label: 'Approve',
          variant: 'success',
          action: 'approve_join_request'
        },
        {
          id: 'deny',
          label: 'Deny',
          variant: 'danger',
          action: 'deny_join_request',
          confirmationRequired: true,
          confirmationMessage: 'Are you sure you want to deny this join request?'
        }
      ]
    })
  }
];

// Helper functions
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffHours < 24) {
    return 'Today';
  } else if (diffHours < 48) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

export function getUrgencyColor(urgency: ActionUrgency): string {
  switch (urgency) {
    case 'urgent': return '#FF3B30'; // Red
    case 'high': return '#FF6B35';   // Orange-red
    case 'medium': return '#FF9500'; // Orange
    case 'low': return '#007AFF';    // Blue
    default: return '#007AFF';
  }
}

export function getActionButtonColor(variant: QuickActionButton['variant']): string {
  switch (variant) {
    case 'primary': return '#007AFF';   // Blue
    case 'success': return '#34C759';   // Green
    case 'danger': return '#FF3B30';    // Red
    case 'secondary': return '#8E8E93'; // Gray
    default: return '#007AFF';
  }
}