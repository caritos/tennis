// Shared tennis types for the application

export interface TennisSet {
  playerScore: number;
  opponentScore: number;
  tiebreak?: {
    playerScore: number;
    opponentScore: number;
  };
}

export interface TennisMatch {
  id: string;
  club_id: string;
  player1_id: string;
  player2_id?: string | null;
  opponent2_name?: string | null;
  scores: string;
  match_type: 'singles' | 'doubles';
  date: string;
  notes?: string;
  created_at: string;
}

export interface TennisPlayer {
  id: string;
  name: string;
  avatar?: string;
}

export interface ParsedTennisMatch {
  id: string;
  clubId: string;
  player1: TennisPlayer;
  player2: TennisPlayer | { id: null; name: string }; // For unregistered opponents
  sets: TennisSet[];
  matchType: 'singles' | 'doubles';
  date: string;
  notes?: string;
  createdAt: string;
  winner: 'player1' | 'player2' | null;
  isComplete: boolean;
}

export type MatchWinner = 'player1' | 'player2' | null;

export interface MatchDisplayProps {
  player1Name: string;
  player2Name: string;
  sets: TennisSet[];
  matchType: 'singles' | 'doubles';
  winner?: MatchWinner;
  isComplete?: boolean;
  showStatus?: boolean;
  compact?: boolean;
}