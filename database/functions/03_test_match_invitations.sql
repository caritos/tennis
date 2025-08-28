-- Test the debug function with the Rerrt club
SELECT debug_match_invitations('959ad058-58dc-4d9a-b341-43fdb8126537'::uuid, 'be01afa0-28ba-4d6d-b256-d9503cdf607f'::uuid);

-- Test the production function with the Rerrt club
SELECT * FROM get_club_match_invitations('959ad058-58dc-4d9a-b341-43fdb8126537'::uuid, 'be01afa0-28ba-4d6d-b256-d9503cdf607f'::uuid);