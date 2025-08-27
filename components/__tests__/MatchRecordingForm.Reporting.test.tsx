import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { MatchRecordingForm } from '../MatchRecordingForm';

// Mock the auth context
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', full_name: 'Test User' },
  }),
}));

// Mock the color scheme hook
jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

describe('MatchRecordingForm - Reporting Section', () => {
  const defaultProps = {
    onSave: jest.fn(),
    clubId: 'club-123',
    matchType: 'singles' as const,
    showReporting: true,
  };

  const playersProps = {
    ...defaultProps,
    players: [
      { id: 'player1', full_name: 'John Smith', phone: '555-0001' },
      { id: 'player2', full_name: 'Jane Doe', phone: '555-0002' },
    ],
  };

  describe('Notes Field in Report Section', () => {
    it('should display notes field inside the report issues section', async () => {
      const { getByText, getByPlaceholderText } = render(
        <MatchRecordingForm {...playersProps} />
      );

      // Expand the report issues section
      const reportHeader = getByText('Report Issues (Optional)');
      fireEvent.press(reportHeader);

      // Notes field should be visible inside the expanded section
      await waitFor(() => {
        expect(getByText('Notes (Optional)')).toBeTruthy();
        expect(getByPlaceholderText('Great competitive match!')).toBeTruthy();
      });
    });

    it('should allow entering notes in the report section', async () => {
      const { getByText, getByPlaceholderText } = render(
        <MatchRecordingForm {...playersProps} />
      );

      // Expand the report issues section
      const reportHeader = getByText('Report Issues (Optional)');
      fireEvent.press(reportHeader);

      // Type in the notes field
      const notesInput = getByPlaceholderText('Great competitive match!');
      fireEvent.changeText(notesInput, 'Excellent sportsmanship from both players');

      expect(notesInput.props.value).toBe('Excellent sportsmanship from both players');
    });

    it('should preserve notes when toggling report section', async () => {
      const { getByText, getByPlaceholderText } = render(
        <MatchRecordingForm {...playersProps} />
      );

      // Expand the report issues section
      const reportHeader = getByText('Report Issues (Optional)');
      fireEvent.press(reportHeader);

      // Enter notes
      const notesInput = getByPlaceholderText('Great competitive match!');
      fireEvent.changeText(notesInput, 'Test notes content');

      // Collapse the section
      fireEvent.press(reportHeader);

      // Re-expand the section
      fireEvent.press(reportHeader);

      // Notes should still be there
      await waitFor(() => {
        const notesInputAgain = getByPlaceholderText('Great competitive match!');
        expect(notesInputAgain.props.value).toBe('Test notes content');
      });
    });

    it('should include notes in the save data', async () => {
      const onSave = jest.fn();
      const { getByText, getByPlaceholderText } = render(
        <MatchRecordingForm {...playersProps} onSave={onSave} />
      );

      // Expand report section and add notes
      fireEvent.press(getByText('Report Issues (Optional)'));
      const notesInput = getByPlaceholderText('Great competitive match!');
      fireEvent.changeText(notesInput, 'Match was played in great spirit');

      // Select winner and save
      fireEvent.press(getByText('John Smith'));
      fireEvent.press(getByText('Save Match'));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            notes: 'Match was played in great spirit',
          }),
          undefined
        );
      });
    });
  });

  describe('Report Section Layout', () => {
    it('should show notes field before player selection', async () => {
      const { getByText, getAllByText } = render(
        <MatchRecordingForm {...playersProps} />
      );

      // Expand the report issues section
      fireEvent.press(getByText('Report Issues (Optional)'));

      await waitFor(() => {
        const allTexts = getAllByText(/.*/);
        const notesIndex = allTexts.findIndex(t => t.children[0] === 'Notes (Optional)');
        const playerSelectIndex = allTexts.findIndex(t => 
          t.children[0] === 'Select player(s) to report:'
        );

        // Notes should appear before player selection
        expect(notesIndex).toBeLessThan(playerSelectIndex);
        expect(notesIndex).toBeGreaterThanOrEqual(0);
        expect(playerSelectIndex).toBeGreaterThanOrEqual(0);
      });
    });

    it('should maintain iOS HIG compliant styling', async () => {
      const { getByText, getByPlaceholderText } = render(
        <MatchRecordingForm {...playersProps} />
      );

      // Expand the report issues section
      fireEvent.press(getByText('Report Issues (Optional)'));

      const notesInput = getByPlaceholderText('Great competitive match!');
      const inputStyles = notesInput.props.style;

      // Check iOS HIG compliance
      expect(inputStyles).toEqual(
        expect.objectContaining({
          fontSize: 15, // iOS HIG: Body text
          borderRadius: 12, // iOS HIG: Standard corner radius
          minHeight: 88, // iOS HIG: 2x minimum touch target for multiline
        })
      );
    });
  });

  describe('Integration with Challenge and Invitation Flows', () => {
    it('should work with challenge match flow', async () => {
      const { getByText, getByPlaceholderText } = render(
        <MatchRecordingForm 
          {...playersProps}
          winnerSectionTitle="Match Winners"
        />
      );

      // Verify custom winner title is used
      expect(getByText('Match Winners')).toBeTruthy();

      // Report section with notes should still work
      fireEvent.press(getByText('Report Issues (Optional)'));
      
      await waitFor(() => {
        expect(getByPlaceholderText('Great competitive match!')).toBeTruthy();
      });
    });

    it('should work with invitation match flow', async () => {
      const { getByText, getByPlaceholderText } = render(
        <MatchRecordingForm 
          {...defaultProps}
          players={[]}  // No pre-populated players for invitation flow
        />
      );

      // Report section should be available
      fireEvent.press(getByText('Report Issues (Optional)'));
      
      await waitFor(() => {
        expect(getByPlaceholderText('Great competitive match!')).toBeTruthy();
      });
    });
  });
});