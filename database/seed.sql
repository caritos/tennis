-- Seed data for Tennis Club App
-- This file contains realistic dummy data for development and testing

-- Users (Tennis Players)
INSERT INTO users (id, full_name, email, phone, role, contact_preference, skill_level, playing_style, profile_visibility, match_history_visibility, allow_challenges, created_at) VALUES
('user_1', 'Alex Rodriguez', 'alex.rodriguez@email.com', '+1-555-0101', 'player', 'whatsapp', 'advanced', 'aggressive', 'public', 'public', 'everyone', '2024-01-15T09:00:00.000Z'),
('user_2', 'Sarah Johnson', 'sarah.johnson@email.com', '+1-555-0102', 'player', 'phone', 'intermediate', 'defensive', 'public', 'public', 'everyone', '2024-01-16T10:30:00.000Z'),
('user_3', 'Mike Chen', 'mike.chen@email.com', '+1-555-0103', 'player', 'whatsapp', 'advanced', 'all_court', 'public', 'public', 'club_members', '2024-01-17T14:15:00.000Z'),
('user_4', 'Emma Davis', 'emma.davis@email.com', '+1-555-0104', 'player', 'text', 'beginner', 'defensive', 'clubs_only', 'clubs_only', 'everyone', '2024-01-18T16:45:00.000Z'),
('user_5', 'Carlos Martinez', 'carlos.martinez@email.com', '+1-555-0105', 'player', 'whatsapp', 'pro', 'serve_volley', 'public', 'public', 'everyone', '2024-01-19T08:20:00.000Z'),
('user_6', 'Lisa Wang', 'lisa.wang@email.com', '+1-555-0106', 'player', 'phone', 'intermediate', 'aggressive', 'public', 'clubs_only', 'club_members', '2024-01-20T11:10:00.000Z'),
('user_7', 'David Thompson', 'david.thompson@email.com', '+1-555-0107', 'player', 'whatsapp', 'advanced', 'all_court', 'public', 'public', 'everyone', '2024-01-21T13:30:00.000Z'),
('user_8', 'Maria Garcia', 'maria.garcia@email.com', '+1-555-0108', 'player', 'text', 'intermediate', 'defensive', 'public', 'public', 'everyone', '2024-01-22T15:45:00.000Z'),
('user_9', 'James Wilson', 'james.wilson@email.com', '+1-555-0109', 'player', 'phone', 'beginner', 'aggressive', 'clubs_only', 'private', 'club_members', '2024-01-23T09:15:00.000Z'),
('user_10', 'Anna Kowalski', 'anna.kowalski@email.com', '+1-555-0110', 'player', 'whatsapp', 'advanced', 'serve_volley', 'public', 'public', 'everyone', '2024-01-24T12:00:00.000Z');

-- Tennis Clubs
INSERT INTO clubs (id, name, description, location, lat, lng, creator_id, created_at) VALUES
('club_1', 'Sunset Tennis Club', 'Premier tennis facility with 8 courts, pro shop, and coaching services. Perfect for players of all skill levels.', '123 Tennis Lane, San Francisco, CA', 37.7749, -122.4194, 'user_1', '2024-01-15T09:30:00.000Z'),
('club_2', 'Marina Bay Tennis Center', 'Modern tennis complex overlooking the bay. Features 6 courts, lounge area, and equipment rental.', '456 Bay View Drive, San Francisco, CA', 37.8044, -122.4078, 'user_3', '2024-01-18T11:00:00.000Z'),
('club_3', 'Golden Gate Park Courts', 'Public tennis courts in the heart of Golden Gate Park. Great community atmosphere and affordable rates.', '789 Park Boulevard, San Francisco, CA', 37.7694, -122.4862, 'user_5', '2024-01-20T14:20:00.000Z'),
('club_4', 'Elite Tennis Academy', 'High-performance training facility with professional coaches and tournament preparation programs.', '321 Champions Court, Palo Alto, CA', 37.4419, -122.1430, 'user_7', '2024-01-22T16:30:00.000Z');

-- Club Memberships
INSERT INTO club_members (club_id, user_id, joined_at) VALUES
-- Sunset Tennis Club members
('club_1', 'user_1', '2024-01-15T09:30:00.000Z'), -- Creator
('club_1', 'user_2', '2024-01-16T11:00:00.000Z'),
('club_1', 'user_4', '2024-01-18T17:00:00.000Z'),
('club_1', 'user_6', '2024-01-20T11:30:00.000Z'),
('club_1', 'user_8', '2024-01-22T16:00:00.000Z'),
('club_1', 'user_10', '2024-01-24T12:30:00.000Z'),

-- Marina Bay Tennis Center members
('club_2', 'user_3', '2024-01-18T11:00:00.000Z'), -- Creator
('club_2', 'user_1', '2024-01-19T09:00:00.000Z'),
('club_2', 'user_5', '2024-01-21T10:15:00.000Z'),
('club_2', 'user_7', '2024-01-23T14:45:00.000Z'),
('club_2', 'user_9', '2024-01-25T13:20:00.000Z'),

-- Golden Gate Park Courts members
('club_3', 'user_5', '2024-01-20T14:20:00.000Z'), -- Creator
('club_3', 'user_2', '2024-01-21T08:30:00.000Z'),
('club_3', 'user_4', '2024-01-22T12:45:00.000Z'),
('club_3', 'user_6', '2024-01-23T15:10:00.000Z'),
('club_3', 'user_8', '2024-01-24T11:25:00.000Z'),
('club_3', 'user_10', '2024-01-25T09:40:00.000Z'),

-- Elite Tennis Academy members
('club_4', 'user_7', '2024-01-22T16:30:00.000Z'), -- Creator
('club_4', 'user_3', '2024-01-23T10:15:00.000Z'),
('club_4', 'user_5', '2024-01-24T13:50:00.000Z'),
('club_4', 'user_9', '2024-01-25T16:20:00.000Z');

-- Tennis Matches
INSERT INTO matches (id, club_id, player1_id, player2_id, opponent2_name, player3_id, partner3_name, player4_id, partner4_name, scores, match_type, date, notes, created_at, updated_at, last_edited_by, edit_count) VALUES
-- Singles matches
('match_1', 'club_1', 'user_1', 'user_2', NULL, NULL, NULL, NULL, NULL, '[{"player":6,"opponent":4},{"player":6,"opponent":2}]', 'singles', '2024-01-25', 'Great match! Very competitive.', '2024-01-25T14:30:00.000Z', '2024-01-25T14:30:00.000Z', 'user_1', 0),
('match_2', 'club_1', 'user_4', 'user_6', NULL, NULL, NULL, NULL, NULL, '[{"player":3,"opponent":6},{"player":4,"opponent":6},{"player":2,"opponent":6}]', 'singles', '2024-01-24', 'Lisa played really well today.', '2024-01-24T16:15:00.000Z', '2024-01-24T16:15:00.000Z', 'user_4', 0),
('match_3', 'club_2', 'user_3', 'user_5', NULL, NULL, NULL, NULL, NULL, '[{"player":6,"opponent":7},{"player":6,"opponent":4}]', 'singles', '2024-01-23', 'Carlos served amazingly in the second set.', '2024-01-23T18:45:00.000Z', '2024-01-23T18:45:00.000Z', 'user_3', 0),
('match_4', 'club_3', 'user_2', 'user_8', NULL, NULL, NULL, NULL, NULL, '[{"player":6,"opponent":2},{"player":6,"opponent":3}]', 'singles', '2024-01-22', 'Quick match, great weather.', '2024-01-22T10:20:00.000Z', '2024-01-22T10:20:00.000Z', 'user_2', 0),

-- Doubles matches
('match_5', 'club_1', 'user_1', 'user_2', NULL, 'user_6', NULL, 'user_8', NULL, '[{"player":6,"opponent":4},{"player":4,"opponent":6},{"player":6,"opponent":2}]', 'doubles', '2024-01-21', 'Epic three-set doubles match!', '2024-01-21T15:00:00.000Z', '2024-01-21T15:00:00.000Z', 'user_1', 0),
('match_6', 'club_2', 'user_3', 'user_7', NULL, 'user_1', NULL, 'user_5', NULL, '[{"player":7,"opponent":6},{"player":3,"opponent":6},{"player":1,"opponent":6}]', 'doubles', '2024-01-20', 'Intense rallies throughout the match.', '2024-01-20T13:30:00.000Z', '2024-01-20T13:30:00.000Z', 'user_3', 0),
('match_7', 'club_3', 'user_5', 'user_10', NULL, 'user_2', NULL, 'user_4', NULL, '[{"player":6,"opponent":1},{"player":6,"opponent":3}]', 'doubles', '2024-01-19', 'Great teamwork from Carlos and Anna.', '2024-01-19T11:45:00.000Z', '2024-01-19T11:45:00.000Z', 'user_5', 0),
('match_8', 'club_4', 'user_7', 'user_9', NULL, 'user_3', NULL, 'user_5', NULL, '[{"player":4,"opponent":6},{"player":6,"opponent":4}]', 'doubles', '2024-01-18', 'Close match, came down to the wire.', '2024-01-18T17:20:00.000Z', '2024-01-18T17:20:00.000Z', 'user_7', 0),

-- Recent matches for variety
('match_9', 'club_1', 'user_10', 'user_1', NULL, NULL, NULL, NULL, NULL, '[{"player":2,"opponent":6},{"player":6,"opponent":4},{"player":6,"opponent":3}]', 'singles', '2024-01-26', 'Anna is improving rapidly!', '2024-01-26T09:30:00.000Z', '2024-01-26T09:30:00.000Z', 'user_10', 0),
('match_10', 'club_2', 'user_5', 'user_9', NULL, NULL, NULL, NULL, NULL, '[{"player":6,"opponent":0},{"player":6,"opponent":2}]', 'singles', '2024-01-26', 'Carlos dominated this match.', '2024-01-26T14:15:00.000Z', '2024-01-26T14:15:00.000Z', 'user_5', 0);

-- Match Invitations (Open Invites)
INSERT INTO match_invitations (id, club_id, creator_id, match_type, date, time, location, notes, status, created_at, expires_at) VALUES
('inv_1', 'club_1', 'user_1', 'singles', '2024-02-01', '6:00 PM', 'Court 3', 'Looking for competitive singles match. Intermediate to advanced level preferred.', 'active', '2024-01-27T10:00:00.000Z', '2024-02-01T18:00:00.000Z'),
('inv_2', 'club_1', 'user_6', 'doubles', '2024-02-02', '10:00 AM', 'Courts 1 & 2', 'Weekend doubles fun! All skill levels welcome.', 'active', '2024-01-27T14:30:00.000Z', '2024-02-02T10:00:00.000Z'),
('inv_3', 'club_2', 'user_3', 'singles', '2024-01-30', '7:30 PM', 'Center Court', 'Evening match with bay view. Bring your A-game!', 'active', '2024-01-27T16:45:00.000Z', '2024-01-30T19:30:00.000Z'),
('inv_4', 'club_3', 'user_5', 'doubles', '2024-01-31', '2:00 PM', 'Location TBD', 'Casual doubles in the park. Great for beginners!', 'active', '2024-01-27T11:20:00.000Z', '2024-01-31T14:00:00.000Z'),
('inv_5', 'club_4', 'user_7', 'singles', '2024-02-03', '11:00 AM', 'Training Court A', 'High-intensity training match. Advanced players only.', 'active', '2024-01-27T09:15:00.000Z', '2024-02-03T11:00:00.000Z'),
('inv_6', 'club_1', 'user_2', 'doubles', '2024-02-04', NULL, 'Any available court', 'Flexible doubles match. Time negotiable!', 'active', '2024-01-27T13:40:00.000Z', '2024-02-04T23:59:00.000Z');

-- Invitation Responses
INSERT INTO invitation_responses (id, invitation_id, user_id, message, status, created_at) VALUES
-- Responses to inv_1 (Alex's singles invitation)
('resp_1', 'inv_1', 'user_2', 'Count me in! Should be a great match.', 'interested', '2024-01-27T11:30:00.000Z'),

-- Responses to inv_2 (Lisa's doubles invitation)  
('resp_2', 'inv_2', 'user_4', 'Perfect timing for weekend tennis!', 'interested', '2024-01-27T15:45:00.000Z'),
('resp_3', 'inv_2', 'user_8', 'I''m in! Looking forward to it.', 'interested', '2024-01-27T17:20:00.000Z'),
('resp_4', 'inv_2', 'user_10', 'Love weekend doubles!', 'interested', '2024-01-27T18:10:00.000Z'),

-- Responses to inv_4 (Carlos's park doubles)
('resp_5', 'inv_4', 'user_2', 'Great for practice!', 'interested', '2024-01-27T12:00:00.000Z'),
('resp_6', 'inv_4', 'user_4', 'Perfect for my skill level.', 'interested', '2024-01-27T14:30:00.000Z'),

-- Response to inv_6 (Sarah's flexible doubles)
('resp_7', 'inv_6', 'user_1', 'Flexible works for me!', 'interested', '2024-01-27T14:15:00.000Z');

-- Sample Notifications
INSERT INTO notifications (id, user_id, type, title, message, is_read, action_type, action_data, related_id, created_at, expires_at) VALUES
('notif_1', 'user_1', 'match_invitation', 'New Match Interest!', 'Sarah Johnson is interested in your singles match on Feb 1st.', 0, 'view_match', '{"invitation_id": "inv_1"}', 'inv_1', '2024-01-27T11:30:00.000Z', '2024-02-01T18:00:00.000Z'),
('notif_2', 'user_6', 'match_invitation', 'Doubles Match Filling Up!', 'You have 3 players interested in your doubles match.', 0, 'view_match', '{"invitation_id": "inv_2"}', 'inv_2', '2024-01-27T18:10:00.000Z', '2024-02-02T10:00:00.000Z'),
('notif_3', 'user_2', 'ranking_update', 'Club Ranking Update', 'You moved up to #3 in Sunset Tennis Club rankings!', 1, 'view_ranking', '{"club_id": "club_1"}', 'club_1', '2024-01-26T20:00:00.000Z', NULL),
('notif_4', 'user_5', 'match_result', 'Match Recorded', 'Your singles win against James has been recorded.', 1, 'view_match', '{"match_id": "match_10"}', 'match_10', '2024-01-26T14:30:00.000Z', NULL),
('notif_5', 'user_3', 'club_activity', 'New Club Member', 'James Wilson joined Marina Bay Tennis Center.', 0, 'view_ranking', '{"club_id": "club_2"}', 'club_2', '2024-01-25T13:20:00.000Z', NULL);