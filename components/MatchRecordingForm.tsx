import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RadioGroup from 'react-native-radio-buttons-group';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { CompactStyles } from '@/constants/CompactStyles';
import { CreateMatchData } from '../services/matchService';
import { isValidTennisScore, validateSetScore } from '../utils/tennisScore';
import MatchTypeSelector from './match-recording/MatchTypeSelector';
import PlayerSearchField from './match-recording/PlayerSearchField';
import MatchDateSection from './match-recording/MatchDateSection';
import ScoreSection from './match-recording/ScoreSection';
import NotesSection from './match-recording/NotesSection';
import { CalendarDatePicker } from './CalendarDatePicker';
import { TennisScoreEntry } from './TennisScoreEntry';
import { TennisSet } from '@/types/tennis';
import { formatScoreString } from '../utils/tennisUtils';
import { Button } from './ui/Button';
import { supabase } from '@/lib/supabase';

interface MatchRecordingFormProps {
  onSave: (matchData: CreateMatchData, reportData?: {
    playerIds: string[];
    type: string;
    description: string;
  }) => void;
  clubId: string;
  initialData?: Partial<CreateMatchData>;
  isEditing?: boolean;
  onCancel?: () => void;
  matchType?: 'singles' | 'doubles';
  players?: {
    id: string;
    full_name: string;
    phone?: string;
  }[];
  showReporting?: boolean;
  isSubmitting?: boolean;
  invitationId?: string;
}

// Legacy interface - can be removed after migration

interface Player {
  id: string;
  name: string;
}

export function MatchRecordingForm(componentProps: MatchRecordingFormProps) {
  // ALL HOOKS MUST BE AT THE TOP - BEFORE ANY EARLY RETURNS OR CONDITIONAL LOGIC
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Get props with fallback for hook safety
  const props = componentProps || {};
  const {
    onSave,
    clubId,
    initialData,
    isEditing = false,
    onCancel,
    matchType: propMatchType,
    players = [],
    showReporting = false,
    isSubmitting = false,
    invitationId
  } = props;

  // All state hooks
  const [matchType, setMatchType] = useState<'singles' | 'doubles'>(propMatchType || initialData?.match_type || 'singles');
  const [matchTypeRadioId, setMatchTypeRadioId] = useState(propMatchType || initialData?.match_type || 'singles');
  
  // State for invitation data
  const [invitationData, setInvitationData] = useState<any>(null);
  const [loadingInvitation, setLoadingInvitation] = useState(!!invitationId);
  const [effectiveClubId, setEffectiveClubId] = useState<string | undefined>(clubId);
  
  // Pre-fill opponent from players prop if available (for challenges)
  const getInitialOpponent = () => {
    if (players.length >= 2 && user) {
      // Find the other player (not the current user)
      const otherPlayer = players.find(p => p.id !== user.id);
      if (otherPlayer) {
        return { id: otherPlayer.id, name: otherPlayer.full_name };
      }
    }
    return null;
  };
  
  const getInitialOpponentText = () => {
    if (players.length >= 2 && user) {
      const otherPlayer = players.find(p => p.id !== user.id);
      if (otherPlayer) {
        return otherPlayer.full_name;
      }
    }
    return initialData?.opponent2_name || '';
  };
  
  const [selectedOpponent, setSelectedOpponent] = useState<Player | null>(getInitialOpponent());
  const [opponentSearchText, setOpponentSearchText] = useState(getInitialOpponentText());
  const [selectedPartner, setSelectedPartner] = useState<Player | null>(null);
  const [partnerSearchText, setPartnerSearchText] = useState(initialData?.partner3_name || '');
  const [selectedOpponentPartner, setSelectedOpponentPartner] = useState<Player | null>(null);
  const [opponentPartnerSearchText, setOpponentPartnerSearchText] = useState(initialData?.partner4_name || '');
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSearchField, setActiveSearchField] = useState<'opponent' | 'partner' | 'opponentPartner' | null>(null);
  const [matchDate, setMatchDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  
  // Handle date changes from calendar
  const handleDateChange = (newDate: string) => {
    setMatchDate(newDate);
  };
  const [tennisSets, setTennisSets] = useState<TennisSet[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [clubMembers, setClubMembers] = useState<Player[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [notes, setNotes] = useState(initialData?.notes || '');

  // Reporting-related state
  const [showReportingSection, setShowReportingSection] = useState(false);
  const [reportedPlayerIds, setReportedPlayerIds] = useState<string[]>([]);
  const [reportType, setReportType] = useState('');
  const [reportDescription, setReportDescription] = useState('');

  // All useEffect hooks
  
  // Load invitation data if invitationId is provided
  useEffect(() => {
    if (invitationId && user) {
      loadInvitationData();
    }
  }, [invitationId, user]);
  
  const loadInvitationData = async () => {
    if (!invitationId || !user) return;
    
    try {
      setLoadingInvitation(true);
      
      // Load invitation with responses
      const { data: invitation, error } = await supabase
        .from('match_invitations')
        .select(`
          *,
          creator:users!creator_id(id, full_name, phone),
          responses:invitation_responses(
            id,
            user_id,
            status,
            user:users!invitation_responses_user_id_fkey(id, full_name, phone)
          )
        `)
        .eq('id', invitationId)
        .single();

      if (error) {
        console.error('Failed to load invitation data:', error);
        return;
      }

      console.log('🎾 Loaded invitation data:', invitation);
      setInvitationData(invitation);
      
      // Set effective club ID from invitation if not already provided
      if (invitation.club_id && !clubId) {
        setEffectiveClubId(invitation.club_id);
      }
      
      // Set match type from invitation
      if (invitation.match_type) {
        setMatchType(invitation.match_type);
        setMatchTypeRadioId(invitation.match_type);
      }
      
      // Set match date from invitation
      if (invitation.date) {
        setMatchDate(invitation.date);
      }
      
      // Pre-fill players from invitation responses
      // Note: Current user could be the creator OR a responder, but they shouldn't be their own opponent
      
      // Get all other players (excluding current user)
      const allOtherPlayers = [];
      
      // Add invitation creator if it's not the current user
      if (invitation.creator && invitation.creator.id !== user.id) {
        allOtherPlayers.push({
          user: {
            id: invitation.creator.id,
            full_name: invitation.creator.full_name,
            phone: invitation.creator.phone
          }
        });
      }
      
      // Add responses (excluding current user)
      if (invitation.responses && invitation.responses.length > 0) {
        const otherPlayerResponses = invitation.responses.filter(
          (response: any) => response.user && response.user.id !== user.id
        );
        allOtherPlayers.push(...otherPlayerResponses);
      }
      
      console.log('🎾 Current user ID:', user.id);
      console.log('🎾 Invitation creator ID:', invitation.creator?.id);
      console.log('🎾 All responses:', invitation.responses?.length || 0);
      console.log('🎾 Other players (excluding current user):', allOtherPlayers.length);
        
      // For singles - just need one opponent (excluding current user)
      if (invitation.match_type === 'singles' && allOtherPlayers.length >= 1) {
        const opponent = allOtherPlayers[0];
        if (opponent.user) {
          setSelectedOpponent({ id: opponent.user.id, name: opponent.user.full_name });
          setOpponentSearchText(opponent.user.full_name);
          console.log('🎾 Singles opponent set:', opponent.user.full_name);
        }
      }
      
      // For doubles - need up to 3 other players (partner + 2 opponents)  
      if (invitation.match_type === 'doubles') {
        if (allOtherPlayers.length >= 1 && allOtherPlayers[0].user) {
          setSelectedPartner({ id: allOtherPlayers[0].user.id, name: allOtherPlayers[0].user.full_name });
          setPartnerSearchText(allOtherPlayers[0].user.full_name);
          console.log('🎾 Doubles partner set:', allOtherPlayers[0].user.full_name);
        }
        if (allOtherPlayers.length >= 2 && allOtherPlayers[1].user) {
          setSelectedOpponent({ id: allOtherPlayers[1].user.id, name: allOtherPlayers[1].user.full_name });
          setOpponentSearchText(allOtherPlayers[1].user.full_name);
          console.log('🎾 Doubles opponent set:', allOtherPlayers[1].user.full_name);
        }
        if (allOtherPlayers.length >= 3 && allOtherPlayers[2].user) {
          setSelectedOpponentPartner({ id: allOtherPlayers[2].user.id, name: allOtherPlayers[2].user.full_name });
          setOpponentPartnerSearchText(allOtherPlayers[2].user.full_name);
          console.log('🎾 Doubles opponent partner set:', allOtherPlayers[2].user.full_name);
        }
      }
      
    } catch (error) {
      console.error('Error loading invitation data:', error);
    } finally {
      setLoadingInvitation(false);
    }
  };

  useEffect(() => {
    console.log('🎾 tennisSets state changed:', tennisSets);
  }, [tennisSets]);

  // Keyboard visibility tracking
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Initialize tennis sets with existing scores when editing
  useEffect(() => {
    console.log('🎾 useEffect triggered with:', { 
      isEditing, 
      hasScores: !!initialData?.scores, 
      scores: initialData?.scores,
      tennisSetsLength: tennisSets.length 
    });
    
    if (isEditing && initialData?.scores && tennisSets.length === 0) {
      console.log('🎾 Parsing initial scores:', initialData.scores);
      try {
        // Parse the score string like "6-4,7-6(7-3),6-2" into TennisSet objects
        const sets = initialData.scores.split(',').map((setScore, index) => {
          const tiebreakMatch = setScore.match(/(\d+)-(\d+)\((\d+)-(\d+)\)/);
          if (tiebreakMatch) {
            return {
              id: `set-${index}`,
              playerScore: parseInt(tiebreakMatch[1]),
              opponentScore: parseInt(tiebreakMatch[2]),
              tiebreak: {
                playerScore: parseInt(tiebreakMatch[3]),
                opponentScore: parseInt(tiebreakMatch[4])
              }
            };
          } else {
            const parts = setScore.split('-');
            return {
              id: `set-${index}`,
              playerScore: parseInt(parts[0]) || 0,
              opponentScore: parseInt(parts[1]) || 0
            };
          }
        });
        console.log('🎾 Parsed sets:', sets);
        setTennisSets(sets);
      } catch (error) {
        console.error('Failed to parse initial scores:', error);
      }
    }
  }, [isEditing, initialData?.scores, tennisSets.length]);

  // Load real club members from database
  useEffect(() => {
    loadClubMembers();
  }, [effectiveClubId]);

  // Filter players based on active search field
  useEffect(() => {
    let searchText = '';
    if (activeSearchField === 'opponent') searchText = opponentSearchText;
    else if (activeSearchField === 'partner') searchText = partnerSearchText;
    else if (activeSearchField === 'opponentPartner') searchText = opponentPartnerSearchText;

    if (searchText.trim() === '') {
      setFilteredPlayers([]);
      setShowSuggestions(false);
      return;
    }

    const searchLower = searchText.toLowerCase();
    const filtered = clubMembers.filter(player => 
      player.name.toLowerCase().includes(searchLower)
    );
    
    setFilteredPlayers(filtered);
    setShowSuggestions(true);
  }, [opponentSearchText, partnerSearchText, opponentPartnerSearchText, clubMembers, activeSearchField]);

  // Initialize selected players when editing and club members are loaded
  useEffect(() => {
    console.log('🔧 PLAYER INIT USEEFFECT RUNNING!');
    
    if (!isEditing || !initialData) {
      console.log('🔧 Skipping player initialization - not editing or no initial data');
      return;
    }

    console.log('🔧 Initializing players for editing:', {
      isEditing,
      hasClubMembers: clubMembers.length > 0,
      initialData: {
        player2_id: initialData.player2_id,
        opponent2_name: initialData.opponent2_name,
        player3_id: initialData.player3_id,
        partner3_name: initialData.partner3_name,
        player4_id: initialData.player4_id,
        partner4_name: initialData.partner4_name,
      },
      currentSelections: {
        selectedOpponent: selectedOpponent?.name,
        selectedPartner: selectedPartner?.name,
        selectedOpponentPartner: selectedOpponentPartner?.name,
      }
    });

    // Initialize opponent
    console.log('🎾 Checking opponent initialization:', { 
      hasPlayer2Id: !!initialData.player2_id, 
      hasOpponent2Name: !!initialData.opponent2_name,
      hasSelectedOpponent: !!selectedOpponent,
      selectedOpponentName: selectedOpponent?.name
    });
    
    if ((initialData.player2_id || initialData.opponent2_name) && !selectedOpponent) {
      console.log('🎾 Initializing opponent...');
      let opponent = null;
      
      if (initialData.player2_id && clubMembers.length > 0) {
        opponent = clubMembers.find(p => p.id === initialData.player2_id);
        console.log('🎾 Found opponent in club members:', opponent);
      }
      
      if (!opponent && initialData.opponent2_name) {
        opponent = {
          id: initialData.player2_id || `external-opponent-${Date.now()}`,
          name: initialData.opponent2_name
        };
        console.log('🎾 Created external opponent:', opponent);
      }
      
      if (opponent) {
        console.log('🎾 Setting opponent:', opponent);
        setSelectedOpponent(opponent);
      } else {
        console.log('🎾 No opponent found for:', { player2_id: initialData.player2_id, opponent2_name: initialData.opponent2_name });
      }
    } else {
      console.log('🎾 Skipping opponent initialization - already have selectedOpponent or no data');
    }

    // Initialize partner (doubles)
    if ((initialData.player3_id || initialData.partner3_name) && !selectedPartner) {
      let partner = null;
      
      if (initialData.player3_id && clubMembers.length > 0) {
        partner = clubMembers.find(p => p.id === initialData.player3_id);
      }
      
      if (!partner && initialData.partner3_name) {
        partner = {
          id: initialData.player3_id || `external-partner-${Date.now()}`,
          name: initialData.partner3_name
        };
      }
      
      if (partner) {
        console.log('🤝 Setting partner:', partner);
        setSelectedPartner(partner);
      } else {
        console.log('🤝 No partner found for:', { player3_id: initialData.player3_id, partner3_name: initialData.partner3_name });
      }
    }

    // Initialize opponent partner (doubles)
    if ((initialData.player4_id || initialData.partner4_name) && !selectedOpponentPartner) {
      let opponentPartner = null;
      
      if (initialData.player4_id && clubMembers.length > 0) {
        opponentPartner = clubMembers.find(p => p.id === initialData.player4_id);
      }
      
      if (!opponentPartner && initialData.partner4_name) {
        opponentPartner = {
          id: initialData.player4_id || `external-opponent-partner-${Date.now()}`,
          name: initialData.partner4_name
        };
      }
      
      if (opponentPartner) {
        console.log('🤝 Setting opponent partner:', opponentPartner);
        setSelectedOpponentPartner(opponentPartner);
      } else {
        console.log('🤝 No opponent partner found for:', { player4_id: initialData.player4_id, partner4_name: initialData.partner4_name });
      }
    }
  }, [isEditing, initialData, clubMembers.length]); // Simplified dependencies

  // Radio button configuration for match type
  const matchTypeRadioButtons = useMemo(() => [
    {
      id: 'singles',
      label: 'Singles',
      value: 'singles',
      color: colors.tint,
      labelStyle: { color: colors.text, fontSize: 16 },
    },
    {
      id: 'doubles', 
      label: 'Doubles',
      value: 'doubles',
      color: colors.tint,
      labelStyle: { color: colors.text, fontSize: 16 },
    }
  ], [colors.tint, colors.text]);
  
  console.log('🔧 MatchRecordingForm props type:', typeof componentProps);
  console.log('🔧 MatchRecordingForm raw props:', componentProps);
  
  // Early return AFTER all hooks
  if (!componentProps) {
    console.error('🔧 MatchRecordingForm received null/undefined props');
    return null;
  }
  
  console.log('🔧 MatchRecordingForm destructured:', { 
    onSave: typeof onSave, 
    clubId, 
    initialData: initialData ? Object.keys(initialData) : null, 
    isEditing, 
    onCancel: typeof onCancel 
  });

  // Handle match type selection
  const handleMatchTypeChange = (matchType: 'singles' | 'doubles') => {
    setMatchType(matchType);
    setMatchTypeRadioId(matchType);
    
    // Clear doubles fields when switching to singles
    if (matchType === 'singles') {
      setSelectedPartner(null);
      setPartnerSearchText('');
      setSelectedOpponentPartner(null);
      setOpponentPartnerSearchText('');
    }
  };

  const loadClubMembers = async () => {
    if (!effectiveClubId) {
      console.log('📋 No effective clubId available yet');
      return;
    }
    
    try {
      console.log('📋 Loading club members for club:', effectiveClubId, 'excluding user:', user?.id);
      
      // Import supabase
      const { supabase } = await import('@/lib/supabase');
      
      // Get all club members except current user
      const { data: members, error } = await supabase
        .from('club_members')
        .select(`
          users (
            id,
            full_name
          )
        `)
        .eq('club_id', effectiveClubId)
        .neq('user_id', user?.id || '');
      
      if (error) {
        console.error('Failed to load club members from Supabase:', error);
        setClubMembers([]);
        return;
      }
      
      const playerList: Player[] = (members || [])
        .filter(m => m.users)
        .map((member: any) => ({
          id: member.users.id,
          name: member.users.full_name || 'Unknown'
        }));
      
      console.log('📋 Loaded club members from Supabase:', playerList);
      setClubMembers(playerList);
    } catch (error) {
      console.error('Failed to load club members:', error);
      setClubMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Legacy functions - removed in favor of TennisScoreEntry component

  const handlePlayerSelect = (player: Player, field: 'opponent' | 'partner' | 'opponentPartner') => {
    if (field === 'opponent') {
      setSelectedOpponent(player);
      setOpponentSearchText(player.name);
    } else if (field === 'partner') {
      setSelectedPartner(player);
      setPartnerSearchText(player.name);
    } else if (field === 'opponentPartner') {
      setSelectedOpponentPartner(player);
      setOpponentPartnerSearchText(player.name);
    }
    setShowSuggestions(false);
    setActiveSearchField(null);
    // Clear validation errors
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleAddNewPlayer = (field: 'opponent' | 'partner' | 'opponentPartner') => {
    console.log('🎾 handleAddNewPlayer called with field:', field);
    
    let searchText = '';
    if (field === 'opponent') searchText = opponentSearchText;
    else if (field === 'partner') searchText = partnerSearchText;
    else if (field === 'opponentPartner') searchText = opponentPartnerSearchText;

    console.log('🎾 searchText for field', field, ':', searchText);

    const newPlayer = {
      id: `new-player-${field}-${Date.now()}`, // Make ID unique
      name: searchText.trim()
    };

    console.log('🎾 Creating new player:', newPlayer);

    if (field === 'opponent') {
      setSelectedOpponent(newPlayer);
      setOpponentSearchText(newPlayer.name);
    } else if (field === 'partner') {
      setSelectedPartner(newPlayer);
      setPartnerSearchText(newPlayer.name);
    } else if (field === 'opponentPartner') {
      setSelectedOpponentPartner(newPlayer);
      setOpponentPartnerSearchText(newPlayer.name);
    }
    
    // Hide current suggestions immediately
    setShowSuggestions(false);
    setActiveSearchField(null);
    
    console.log('🎾 Current matchType:', matchType, 'field:', field);
    
    // Automatic field progression with more robust state management
    if (matchType === 'doubles') {
      // Use React's state batching with multiple setStates in sequence
      setTimeout(() => {
        if (field === 'opponent') {
          console.log('🎾 Moving from opponent to partner');
          setPartnerSearchText(''); // Clear partner field first
          setActiveSearchField('partner');
          setShowSuggestions(true);
        } else if (field === 'partner') {
          console.log('🎾 Moving from partner to opponent partner');
          setOpponentPartnerSearchText(''); // Clear opponent partner field first
          setActiveSearchField('opponentPartner');
          setShowSuggestions(true);
        } else if (field === 'opponentPartner') {
          console.log('🎾 All players selected, dismissing keyboard');
          Keyboard.dismiss();
        }
      }, 250); // Longer delay to ensure all state updates complete
    } else {
      // For singles, dismiss keyboard after short delay
      setTimeout(() => {
        console.log('🎾 Singles opponent selected, dismissing keyboard');
        Keyboard.dismiss();
      }, 250);
    }
    
    // Clear validation errors
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleSearchTextChange = (text: string, field: 'opponent' | 'partner' | 'opponentPartner') => {
    if (field === 'opponent') {
      setOpponentSearchText(text);
      if (selectedOpponent && text !== selectedOpponent.name) {
        setSelectedOpponent(null);
      }
    } else if (field === 'partner') {
      setPartnerSearchText(text);
      if (selectedPartner && text !== selectedPartner.name) {
        setSelectedPartner(null);
      }
    } else if (field === 'opponentPartner') {
      setOpponentPartnerSearchText(text);
      if (selectedOpponentPartner && text !== selectedOpponentPartner.name) {
        setSelectedOpponentPartner(null);
      }
    }
    
    setActiveSearchField(field);
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!selectedOpponent && !opponentSearchText.trim()) {
      errors.push('Please select or enter an opponent');
    }

    if (opponentSearchText.trim() && !selectedOpponent) {
      errors.push('Please select an opponent from the list or add as new player');
    }

    // Validate doubles partners
    if (matchType === 'doubles') {
      if (!selectedPartner && !partnerSearchText.trim()) {
        errors.push('Please select or enter your partner');
      }

      if (partnerSearchText.trim() && !selectedPartner) {
        errors.push('Please select your partner from the list or add as new player');
      }

      if (!selectedOpponentPartner && !opponentPartnerSearchText.trim()) {
        errors.push('Please select or enter opponent\'s partner');
      }

      if (opponentPartnerSearchText.trim() && !selectedOpponentPartner) {
        errors.push('Please select opponent\'s partner from the list or add as new player');
      }
    }

    if (tennisSets.length === 0) {
      errors.push('Please add at least one set score');
    }

    // Validate complete match score using tennis sets
    if (tennisSets.length > 0) {
      const scoreString = formatScoreString(tennisSets);
      if (!isValidTennisScore(scoreString)) {
        errors.push('Please complete the match - a winner must be determined');
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSave = () => {
    const isValidForm = validateForm();
    if (!isValidForm) {
      return;
    }

    if (!user?.id) {
      setValidationErrors(['Please sign in to record a match']);
      return;
    }

    // Use the new tennis sets format
    const scoreString = formatScoreString(tennisSets);
    console.log('🎾 Final scoreString to save:', scoreString);
    
    const matchData: CreateMatchData = {
      club_id: effectiveClubId,
      player1_id: user.id, // Use actual user ID from auth context
      player2_id: selectedOpponent?.id?.startsWith('new-player') ? null : selectedOpponent?.id || null,
      opponent2_name: selectedOpponent?.id?.startsWith('new-player') ? selectedOpponent.name : null,
      player3_id: selectedPartner?.id?.startsWith('new-player') ? null : selectedPartner?.id || null,
      partner3_name: selectedPartner?.id?.startsWith('new-player') ? selectedPartner?.name : null,
      player4_id: selectedOpponentPartner?.id?.startsWith('new-player') ? null : selectedOpponentPartner?.id || null,
      partner4_name: selectedOpponentPartner?.id?.startsWith('new-player') ? selectedOpponentPartner?.name : null,
      scores: scoreString,
      match_type: matchType,
      date: matchDate,
      notes: notes.trim() || undefined,
    };

    // Prepare report data if any players are reported
    let reportData = undefined;
    if (showReporting && reportedPlayerIds.length > 0 && reportType && reportDescription.trim()) {
      reportData = {
        playerIds: reportedPlayerIds,
        type: reportType,
        description: reportDescription.trim()
      };
    }

    onSave(matchData, reportData);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: CompactStyles.scrollContent.paddingHorizontal,
      paddingBottom: 20, // Normal bottom padding for scroll content
    },
    title: {
      fontSize: CompactStyles.title.fontSize,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: CompactStyles.sectionMargin,
      textAlign: 'center',
    },
    section: {
      marginBottom: CompactStyles.sectionMargin,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: CompactStyles.smallMargin,
    },
    radioGroupContainer: {
      alignItems: 'flex-start',
    },
    searchInput: {
      borderWidth: 1,
      borderColor: colors.tabIconDefault,
      borderRadius: CompactStyles.input.borderRadius,
      paddingVertical: CompactStyles.input.paddingVertical,
      paddingHorizontal: CompactStyles.input.paddingHorizontal,
      fontSize: CompactStyles.input.fontSize,
      color: colors.text,
      backgroundColor: colors.background,
    },
    searchInputFocused: {
      borderColor: colors.tint,
      borderWidth: 2,
    },
    searchInputSelected: {
      borderColor: '#4CAF50', // Green border for confirmation
      backgroundColor: '#4CAF50' + '15', // Light green background
      borderWidth: 2,
      fontWeight: '600', // Bold text
      color: '#2E7D32', // Dark green text
    },
    inputContainer: {
      position: 'relative',
    },
    successIcon: {
      position: 'absolute',
      right: 12,
      top: '50%',
      marginTop: -10,
    },
    dateInput: {
      borderWidth: 1,
      borderColor: colors.tabIconDefault,
      borderRadius: CompactStyles.input.borderRadius,
      paddingVertical: CompactStyles.input.paddingVertical,
      paddingHorizontal: CompactStyles.input.paddingHorizontal,
      fontSize: CompactStyles.input.fontSize,
      color: colors.text,
      backgroundColor: colors.background,
    },
    addSetButton: {
      marginBottom: CompactStyles.itemMargin,
    },
    setContainer: {
      backgroundColor: colors.background,
      borderRadius: CompactStyles.input.borderRadius,
      padding: CompactStyles.itemMargin,
      marginBottom: CompactStyles.smallMargin,
      borderWidth: 1,
      borderColor: colors.tabIconDefault,
    },
    setTitle: {
      fontSize: CompactStyles.input.fontSize,
      fontWeight: '600',
      color: colors.text,
      marginBottom: CompactStyles.smallMargin,
    },
    scoreInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: CompactStyles.itemMargin,
    },
    scoreInput: {
      borderWidth: 1,
      borderColor: colors.tabIconDefault,
      borderRadius: 6,
      padding: CompactStyles.smallMargin,
      width: 60,
      textAlign: 'center',
      fontSize: CompactStyles.input.fontSize,
      color: colors.text,
      backgroundColor: colors.background,
    },
    scoreLabel: {
      fontSize: CompactStyles.input.fontSize,
      color: colors.text,
      flex: 1,
    },
    errorContainer: {
      backgroundColor: '#ffebee',
      padding: CompactStyles.smallMargin,
      borderRadius: CompactStyles.input.borderRadius,
      marginBottom: CompactStyles.itemMargin,
    },
    errorText: {
      color: '#c62828',
      fontSize: CompactStyles.errorText.fontSize,
    },
    buttonContainer: {
      marginTop: 24,
    },
    keyboardToolbar: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderTopLeftRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 5,
      zIndex: 1000,
    },
    keyboardToolbarText: {
      fontSize: 16,
      fontWeight: '600',
    },
    saveButtonSection: {
      marginTop: 30,
      marginBottom: 20,
    },
    saveButton: {
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 32,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 56,
    },
    saveButtonText: {
      fontSize: 18,
      fontWeight: '600',
    },
    suggestionsContainer: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.tabIconDefault,
      borderRadius: 8,
      marginTop: 4,
      maxHeight: 200,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    suggestionItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.tabIconDefault,
    },
    suggestionItemLast: {
      borderBottomWidth: 0,
    },
    suggestionText: {
      fontSize: 16,
      color: colors.text,
    },
    addNewPlayerItem: {
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: colors.tabIconDefault,
      backgroundColor: colors.background,
    },
    addNewPlayerText: {
      fontSize: 16,
      color: colors.tint,
      fontWeight: '500',
    },
    placeholderContainer: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 24,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.tabIconDefault,
      borderStyle: 'dashed',
    },
    placeholderTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.tabIconDefault,
      marginBottom: 8,
      textAlign: 'center',
    },
    placeholderText: {
      fontSize: 14,
      color: colors.tabIconDefault,
      textAlign: 'center',
      lineHeight: 20,
    },
    inputLabel: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 6,
      fontWeight: '500',
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.tabIconDefault,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.background,
    },
    tiebreakSection: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.tabIconDefault,
    },
    tiebreakTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    notesInput: {
      borderWidth: 1,
      borderColor: colors.tabIconDefault,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.background,
      minHeight: 80,
      textAlignVertical: 'top',
    },

    // Reporting section styles
    reportSectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
    },
    reportSectionTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    reportContent: {
      marginTop: 12,
    },
    reportSubtitle: {
      fontSize: 14,
      marginBottom: 16,
      fontStyle: 'italic',
    },
    reportPlayersSection: {
      marginBottom: 16,
    },
    reportLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    playerCheckbox: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    radioButton: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    playerName: {
      fontSize: 16,
    },
    reportTypeSection: {
      marginBottom: 16,
    },
    reportDescriptionSection: {
      marginBottom: 8,
    },
    reportTextInput: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      minHeight: 80,
      textAlignVertical: 'top',
      marginBottom: 8,
    },
    characterCount: {
      fontSize: 12,
      textAlign: 'right',
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      flex: 1,
      padding: 20,
    },
    loadingText: {
      fontSize: 16,
      textAlign: 'center',
      color: '#666',
    },
  });

  // Show loading state while invitation data is being loaded
  if (loadingInvitation) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading match details...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView 
        style={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <View style={styles.errorContainer}>
            {validationErrors.map((error, index) => (
              <Text key={index} style={styles.errorText}>
                {error}
              </Text>
            ))}
          </View>
        )}

        {/* Match Type */}
        <MatchTypeSelector
          selectedType={matchType}
          onTypeChange={handleMatchTypeChange}
          colors={colors}
        />

        {/* Your Partner - Only show for doubles matches */}
        {matchType === 'doubles' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Partner</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.searchInput,
                  selectedPartner && styles.searchInputSelected, // Green confirmation when selected
                  showSuggestions && activeSearchField === 'partner' && styles.searchInputFocused
                ]}
                value={partnerSearchText}
                onChangeText={(text) => handleSearchTextChange(text, 'partner')}
                placeholder="🔍 Search or add partner..."
                testID="partner-search-input"
                onFocus={() => {
                  setActiveSearchField('partner');
                  if (partnerSearchText.trim()) {
                    setShowSuggestions(true);
                  }
                }}
              />
              {selectedPartner && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#4CAF50"
                  style={styles.successIcon}
                />
              )}
            </View>

            {/* Search Suggestions for Partner */}
            {showSuggestions && activeSearchField === 'partner' && (
              <View style={styles.suggestionsContainer}>
                {/* Existing Players */}
                {filteredPlayers.map((player, index) => (
                  <TouchableOpacity
                    key={player.id}
                    style={[
                      styles.suggestionItem,
                      index === filteredPlayers.length - 1 && filteredPlayers.length > 0 && partnerSearchText.trim() && 
                      !filteredPlayers.some(p => p.name.toLowerCase() === partnerSearchText.toLowerCase()) && 
                      styles.suggestionItemLast
                    ]}
                    onPress={() => handlePlayerSelect(player, 'partner')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.suggestionText}>{player.name}</Text>
                  </TouchableOpacity>
                ))}
                
                {/* Add New Player Option */}
                {partnerSearchText.trim() && 
                 !filteredPlayers.some(player => 
                   player.name.toLowerCase() === partnerSearchText.toLowerCase()
                 ) && (
                  <TouchableOpacity
                    style={styles.addNewPlayerItem}
                    onPress={() => handleAddNewPlayer('partner')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.addNewPlayerText}>
                      + Add {partnerSearchText.trim()} as unregistered player
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        {/* Opponent Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {matchType === 'doubles' ? 'Opponent 1' : 'Opponent'}
            {players.length >= 2 && ' (Challenge Match)'}
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.searchInput,
                selectedOpponent && styles.searchInputSelected, // Green confirmation when selected
                showSuggestions && styles.searchInputFocused,
                players.length >= 2 && { backgroundColor: colors.background + '50' } // Visual indication when pre-filled
              ]}
              value={opponentSearchText}
              onChangeText={(text) => players.length >= 2 ? null : handleSearchTextChange(text, 'opponent')}
              placeholder="🔍 Search or add opponent..."
              testID="opponent-search-input"
              editable={players.length < 2} // Disable editing when players are pre-defined from challenge
              onFocus={() => {
                if (players.length < 2) {
                  setActiveSearchField('opponent');
                  if (opponentSearchText.trim()) {
                    setShowSuggestions(true);
                  }
                }
              }}
            />
            {selectedOpponent && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color="#4CAF50"
                style={styles.successIcon}
              />
            )}
          </View>

          {/* Search Suggestions */}
          {showSuggestions && (
            <View style={styles.suggestionsContainer}>
              {/* Existing Players */}
              {filteredPlayers.map((player, index) => (
                <TouchableOpacity
                  key={player.id}
                  style={[
                    styles.suggestionItem,
                    index === filteredPlayers.length - 1 && filteredPlayers.length > 0 && opponentSearchText.trim() && 
                    !filteredPlayers.some(p => p.name.toLowerCase() === opponentSearchText.toLowerCase()) && 
                    styles.suggestionItemLast
                  ]}
                  onPress={() => handlePlayerSelect(player, activeSearchField || 'opponent')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionText}>{player.name}</Text>
                </TouchableOpacity>
              ))}
              
              {/* Add New Player Option */}
              {opponentSearchText.trim() && 
               !filteredPlayers.some(player => 
                 player.name.toLowerCase() === opponentSearchText.toLowerCase()
               ) && (
                <TouchableOpacity
                  style={styles.addNewPlayerItem}
                  onPress={() => handleAddNewPlayer(activeSearchField || 'opponent')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addNewPlayerText}>
                    + Add {opponentSearchText.trim()} as unregistered player
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Opponent's Partner - Only show for doubles matches */}
        {matchType === 'doubles' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Opponent 2</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.searchInput,
                  selectedOpponentPartner && styles.searchInputSelected, // Green confirmation when selected
                  showSuggestions && activeSearchField === 'opponentPartner' && styles.searchInputFocused
                ]}
                value={opponentPartnerSearchText}
                onChangeText={(text) => handleSearchTextChange(text, 'opponentPartner')}
                placeholder="🔍 Search or add opponent&apos;s partner..."
                testID="opponent-partner-search-input"
                onFocus={() => {
                  setActiveSearchField('opponentPartner');
                  if (opponentPartnerSearchText.trim()) {
                    setShowSuggestions(true);
                  }
                }}
              />
              {selectedOpponentPartner && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#4CAF50"
                  style={styles.successIcon}
                />
              )}
            </View>

              {/* Search Suggestions for Opponent's Partner */}
              {showSuggestions && activeSearchField === 'opponentPartner' && (
                <View style={styles.suggestionsContainer}>
                  {/* Existing Players */}
                  {filteredPlayers.map((player, index) => (
                    <TouchableOpacity
                      key={player.id}
                      style={[
                        styles.suggestionItem,
                        index === filteredPlayers.length - 1 && filteredPlayers.length > 0 && opponentPartnerSearchText.trim() && 
                        !filteredPlayers.some(p => p.name.toLowerCase() === opponentPartnerSearchText.toLowerCase()) && 
                        styles.suggestionItemLast
                      ]}
                      onPress={() => handlePlayerSelect(player, 'opponentPartner')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.suggestionText}>{player.name}</Text>
                    </TouchableOpacity>
                  ))}
                  
                  {/* Add New Player Option */}
                  {opponentPartnerSearchText.trim() && 
                   !filteredPlayers.some(player => 
                     player.name.toLowerCase() === opponentPartnerSearchText.toLowerCase()
                   ) && (
                    <TouchableOpacity
                      style={styles.addNewPlayerItem}
                      onPress={() => handleAddNewPlayer('opponentPartner')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.addNewPlayerText}>
                        + Add {opponentPartnerSearchText.trim()} as unregistered player
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
        )}

        {/* Match Date */}
        <View style={styles.section}>
          <CalendarDatePicker
            selectedDate={matchDate}
            onDateChange={handleDateChange}
            label="Match Date"
            placeholder="Select match date"
            maxDate={new Date().toISOString().split('T')[0]} // Can't select future dates
          />
        </View>

        {/* Tennis Score Entry */}
        {(() => {
          // Calculate player names safely
          const player1Name = matchType === 'doubles' ? 
            (selectedPartner?.name ? `You & ${selectedPartner.name}` : "You & [Partner not selected]") : 
            "You";
          
          const player2Name = matchType === 'doubles' ? 
            (selectedOpponentPartner?.name ? 
              `${selectedOpponent?.name || 'Opponent'} & ${selectedOpponentPartner.name}` : 
              `${selectedOpponent?.name || 'Opponent'} & [Partner not selected]`) : 
            (selectedOpponent?.name || 'Opponent');

          console.log('🎾 TennisScoreEntry props:', { player1Name, player2Name, matchType });

          // Only render if we have the required players and valid names
          const canRender = (matchType === 'singles' && selectedOpponent && selectedOpponent.name) || 
                           (matchType === 'doubles' && selectedOpponent && selectedPartner && selectedOpponentPartner &&
                            selectedOpponent.name && selectedPartner.name && selectedOpponentPartner.name);

          if (canRender && player1Name && player2Name) {
            return (
              <View style={styles.section}>
                <TennisScoreEntry
                  player1Name={player1Name}
                  player2Name={player2Name}
                  matchType={matchType}
                  onScoreChange={(sets) => {
                    console.log('🎾 MatchRecordingForm: onScoreChange received:', sets);
                    setTennisSets(sets);
                  }}
                  initialSets={tennisSets}
                  showPreview={true}
                  compact={false}
                />
                {/* Debug info */}
                {isEditing && (
                  <Text style={{ fontSize: 12, color: 'gray', marginTop: 10 }}>
                    Debug - Initial scores: {initialData?.scores || 'none'}
                  </Text>
                )}
                {isEditing && (
                  <Text style={{ fontSize: 12, color: 'gray' }}>
                    Debug - Tennis sets: {JSON.stringify(tennisSets)}
                  </Text>
                )}
              </View>
            );
          } else {
            console.log('🎾 Not rendering TennisScoreEntry yet:', { 
              canRender, 
              player1Name, 
              player2Name,
              selectedOpponent: selectedOpponent?.name,
              selectedPartner: selectedPartner?.name,
              selectedOpponentPartner: selectedOpponentPartner?.name
            });
            return (
              <View style={styles.section}>
                <View style={styles.placeholderContainer}>
                  <Text style={styles.placeholderTitle}>⏳ Select {matchType === 'doubles' ? 'all players' : 'an opponent'} to continue</Text>
                  <Text style={styles.placeholderText}>
                    {matchType === 'doubles' ? 
                      'Select your partner and both opponents to start recording match scores' :
                      'Search for a club member or add a new player to start recording match scores'}
                  </Text>
                </View>
              </View>
            );
          }
        })()}

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Great competitive match!"
            placeholderTextColor={colors.tabIconDefault}
            multiline
            testID="notes-input"
          />
        </View>

        {/* Report Player Section - Only show if enabled */}
        {showReporting && (players.length > 0 || invitationId) && (() => {
          // Build available players list for reporting from both props and internal state
          const getAvailablePlayersForReporting = () => {
            // For challenge matches, use players prop
            if (players.length > 0) {
              return players.filter(p => p.id !== user?.id);
            }
            
            // For invitation matches, build from selected players in internal state
            const availablePlayers = [];
            
            if (selectedOpponent) {
              availablePlayers.push({ 
                id: selectedOpponent.id, 
                full_name: selectedOpponent.name,
                name: selectedOpponent.name // For compatibility
              });
            }
            
            if (selectedPartner && matchType === 'doubles') {
              availablePlayers.push({ 
                id: selectedPartner.id, 
                full_name: selectedPartner.name,
                name: selectedPartner.name
              });
            }
            
            if (selectedOpponentPartner && matchType === 'doubles') {
              availablePlayers.push({ 
                id: selectedOpponentPartner.id, 
                full_name: selectedOpponentPartner.name,
                name: selectedOpponentPartner.name
              });
            }
            
            return availablePlayers;
          };
          
          const availablePlayersForReporting = getAvailablePlayersForReporting();
          
          return (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.reportSectionHeader}
              onPress={() => {
                setShowReportingSection(!showReportingSection);
                // For singles matches, automatically select the opponent when opening
                if (!showReportingSection && matchType === 'singles' && availablePlayersForReporting.length > 0) {
                  setReportedPlayerIds([availablePlayersForReporting[0].id]);
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.reportSectionTitle}>
                Report Player Issue
              </Text>
              <Ionicons
                name={showReportingSection ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.tabIconDefault}
              />
            </TouchableOpacity>

            {showReportingSection && (
              <View style={styles.reportContent}>
                <Text style={[styles.reportSubtitle, { color: colors.tabIconDefault }]}>
                  Only report serious issues that violate community guidelines
                </Text>

                {/* For singles matches, show who is being reported */}
                {matchType === 'singles' && availablePlayersForReporting.length > 0 && (
                  <View style={styles.reportPlayersSection}>
                    <Text style={[styles.reportLabel, { marginBottom: 8 }]}>
                      Reporting: {availablePlayersForReporting[0].full_name || availablePlayersForReporting[0].name}
                    </Text>
                  </View>
                )}

                {/* Player Selection - Only show for doubles matches */}
                {matchType === 'doubles' && (
                  <View style={styles.reportPlayersSection}>
                    <Text style={styles.reportLabel}>Which player(s)?</Text>
                    {availablePlayersForReporting.map((player) => (
                    <TouchableOpacity
                      key={player.id}
                      style={styles.playerCheckbox}
                      onPress={() => {
                        if (matchType === 'singles') {
                          // Singles: radio button behavior
                          setReportedPlayerIds(
                            reportedPlayerIds.includes(player.id) ? [] : [player.id]
                          );
                        } else {
                          // Doubles: checkbox behavior
                          setReportedPlayerIds(prev => 
                            prev.includes(player.id) 
                              ? prev.filter(id => id !== player.id)
                              : [...prev, player.id]
                          );
                        }
                      }}
                    >
                      <View style={[
                        matchType === 'singles' ? styles.radioButton : styles.checkbox,
                        {
                          borderColor: colors.tint,
                          backgroundColor: reportedPlayerIds.includes(player.id) ? colors.tint : 'transparent'
                        }
                      ]}>
                        {reportedPlayerIds.includes(player.id) && (
                          <Ionicons 
                            name="checkmark" 
                            size={matchType === 'singles' ? 10 : 14} 
                            color="white" 
                          />
                        )}
                      </View>
                      <Text style={[styles.playerName, { color: colors.text }]}>
                        {player.full_name}
                      </Text>
                    </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Report Type Selection */}
                {reportedPlayerIds.length > 0 && (
                  <View style={styles.reportTypeSection}>
                    <Text style={styles.reportLabel}>What happened?</Text>
                    {[
                      { key: 'no_show', label: 'Did Not Show Up' },
                      { key: 'poor_behavior', label: 'Poor Behavior During Match' },
                      { key: 'unsportsmanlike', label: 'Unsportsmanlike Conduct' },
                      { key: 'other', label: 'Other Issue' }
                    ].map((type) => (
                      <TouchableOpacity
                        key={type.key}
                        style={styles.playerCheckbox}
                        onPress={() => setReportType(type.key)}
                      >
                        <View style={[
                          styles.radioButton,
                          {
                            borderColor: colors.tint,
                            backgroundColor: reportType === type.key ? colors.tint : 'transparent'
                          }
                        ]}>
                          {reportType === type.key && (
                            <Ionicons name="checkmark" size={10} color="white" />
                          )}
                        </View>
                        <Text style={[styles.playerName, { color: colors.text }]}>
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Description */}
                {reportType && (
                  <View style={styles.reportDescriptionSection}>
                    <Text style={styles.reportLabel}>
                      Additional Details {reportType === 'other' ? '(Required)' : ''}
                    </Text>
                    <TextInput
                      style={[styles.reportTextInput, { borderColor: colors.tabIconDefault + '30', color: colors.text }]}
                      placeholder="Provide more details about what happened..."
                      placeholderTextColor={colors.tabIconDefault}
                      value={reportDescription}
                      onChangeText={setReportDescription}
                      multiline
                      numberOfLines={3}
                      maxLength={300}
                    />
                    <Text style={[styles.characterCount, { color: colors.tabIconDefault }]}>
                      {reportDescription.length}/300 characters
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
          );
        })()}

        {/* Save Match Button - Inside ScrollView */}
        <View style={styles.saveButtonSection}>
          <Button
            title={isSubmitting ? "Saving..." : "Save Match"}
            onPress={handleSave}
            variant="primary"
            size="large"
            fullWidth={true}
            disabled={isSubmitting}
            testID="save-match-button"
          />
        </View>
      </ScrollView>
      
      {/* Keyboard Toolbar - Only show when keyboard is visible */}
      {keyboardVisible && (
        <TouchableOpacity 
          style={[styles.keyboardToolbar, { backgroundColor: colors.background }]}
          onPress={() => Keyboard.dismiss()}
          activeOpacity={0.9}
        >
          <Text style={[styles.keyboardToolbarText, { color: colors.tint }]}>Done</Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}