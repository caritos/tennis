import React from 'react';
import { render, screen } from '@testing-library/react-native';
import ProfileScreen from '../app/(tabs)/profile';

describe('Profile Tab', () => {
  it('should display "Profile" header', () => {
    render(<ProfileScreen />);
    expect(screen.getByText('Profile')).toBeTruthy();
  });

  it('should display user name section', () => {
    render(<ProfileScreen />);
    expect(screen.getByText('Eladio Caritos')).toBeTruthy();
  });

  it('should display tennis stats section', () => {
    render(<ProfileScreen />);
    expect(screen.getByText('Tennis Stats')).toBeTruthy();
  });

  it('should display match history section', () => {
    render(<ProfileScreen />);
    expect(screen.getByText('Match History')).toBeTruthy();
  });

  it('should display club memberships section', () => {
    render(<ProfileScreen />);
    expect(screen.getByText('Club Memberships')).toBeTruthy();
  });

  it('should display settings section', () => {
    render(<ProfileScreen />);
    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('should show placeholder when no stats available', () => {
    render(<ProfileScreen />);
    expect(screen.getAllByText('No matches played yet')).toHaveLength(2);
    expect(screen.getAllByText('Record your first match!')).toHaveLength(2);
  });

  it('should show placeholder when no club memberships', () => {
    render(<ProfileScreen />);
    expect(screen.getByText('No club memberships')).toBeTruthy();
    expect(screen.getByText('Join a club to start playing!')).toBeTruthy();
  });
});