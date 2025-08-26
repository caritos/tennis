-- Add new notification action types
-- Migration: Add view_club and view_match action types to notifications table

-- Update the action_type constraint to include new types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_action_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_action_type_check 
CHECK (action_type IN (
    'accept_challenge', 
    'decline_challenge', 
    'view_match', 
    'view_ranking', 
    'join_club',
    'view_club'
));