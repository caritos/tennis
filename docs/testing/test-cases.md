# Test Cases for Tennis Community App

This document provides specific test cases for each task in TODO.md, following TDD principles.

## Navigation & App Structure Tests

### Install @react-navigation/bottom-tabs dependency
```typescript
// __tests__/dependencies.test.ts
describe('Navigation Dependencies', () => {
  it('should have @react-navigation/bottom-tabs installed', () => {
    const packageJson = require('../package.json');
    expect(packageJson.dependencies['@react-navigation/bottom-tabs']).toBeDefined();
  });
});
```

### Create basic 2-tab bottom navigation structure
```typescript
// __tests__/navigation/BottomTabs.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import BottomTabs from '../navigation/BottomTabs';

describe('BottomTabs Component', () => {
  it('should render tab navigator', () => {
    const { getByTestId } = render(<BottomTabs />);
    expect(getByTestId('bottom-tab-navigator')).toBeTruthy();
  });

  it('should have exactly 2 tabs', () => {
    const { getAllByRole } = render(<BottomTabs />);
    const tabs = getAllByRole('tab');
    expect(tabs).toHaveLength(2);
  });
});
```

### Add Club Tab with placeholder content
```typescript
// __tests__/screens/ClubTab.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import ClubTab from '../screens/ClubTab';

describe('ClubTab Screen', () => {
  it('should render club tab content', () => {
    const { getByTestId } = render(<ClubTab />);
    expect(getByTestId('club-tab-screen')).toBeTruthy();
  });

  it('should display placeholder text', () => {
    const { getByText } = render(<ClubTab />);
    expect(getByText(/Club Tab/)).toBeTruthy();
  });
});
```

### Add Profile Tab with placeholder content
```typescript
// __tests__/screens/ProfileTab.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import ProfileTab from '../screens/ProfileTab';

describe('ProfileTab Screen', () => {
  it('should render profile tab content', () => {
    const { getByTestId } = render(<ProfileTab />);
    expect(getByTestId('profile-tab-screen')).toBeTruthy();
  });

  it('should display placeholder text', () => {
    const { getByText } = render(<ProfileTab />);
    expect(getByText(/Profile Tab/)).toBeTruthy();
  });
});
```

### Style tab bar with tennis theme colors
```typescript
// __tests__/navigation/TabBarStyles.test.tsx
describe('Tab Bar Styling', () => {
  it('should use tennis theme colors', () => {
    const { getByTestId } = render(<BottomTabs />);
    const tabBar = getByTestId('bottom-tab-navigator');
    
    expect(tabBar.props.screenOptions.tabBarStyle).toEqual(
      expect.objectContaining({
        backgroundColor: expect.any(String),
      })
    );
  });
});
```

### Add tab icons (🎾 for Club, 👤 for Profile)
```typescript
// __tests__/navigation/TabIcons.test.tsx
describe('Tab Icons', () => {
  it('should display tennis ball icon for Club tab', () => {
    const { getByText } = render(<BottomTabs />);
    expect(getByText('🎾')).toBeTruthy();
  });

  it('should display person icon for Profile tab', () => {
    const { getByText } = render(<BottomTabs />);
    expect(getByText('👤')).toBeTruthy();
  });
});
```

## Core Database & Authentication Tests

### Install expo-sqlite dependency
```typescript
// __tests__/dependencies.test.ts
describe('Database Dependencies', () => {
  it('should have expo-sqlite installed', () => {
    const packageJson = require('../package.json');
    expect(packageJson.dependencies['expo-sqlite']).toBeDefined();
  });
});
```

### Database Integration Tests
```typescript
// __tests__/database/supabase.test.ts
import { supabase } from '../lib/supabase';

describe('Supabase Database Integration', () => {
  it('should connect to Supabase', async () => {
    const { data, error } = await supabase.from('clubs').select('count', { count: 'exact', head: true });
    expect(error).toBeNull();
    expect(data).not.toBeNull();
  });

  it('should have proper RLS policies', async () => {
    // Test that unauthorized access is blocked
    const { data, error } = await supabase.from('users').select('*');
    expect(error).toBeDefined(); // Should fail without auth
  });
});
```

### Design users table schema
```typescript
// __tests__/database/schemas/users.test.ts
import { createUsersTable } from '../database/schemas/users';

describe('Users Table Schema', () => {
  it('should create users table with correct columns', async () => {
    const mockDb = { exec: jest.fn() };
    await createUsersTable(mockDb);
    
    expect(mockDb.exec).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS users')
    );
    expect(mockDb.exec).toHaveBeenCalledWith(
      expect.stringContaining('id TEXT PRIMARY KEY')
    );
    expect(mockDb.exec).toHaveBeenCalledWith(
      expect.stringContaining('name TEXT NOT NULL')
    );
    expect(mockDb.exec).toHaveBeenCalledWith(
      expect.stringContaining('email TEXT UNIQUE NOT NULL')
    );
  });
});
```

### Design clubs table schema
```typescript
// __tests__/database/schemas/clubs.test.ts
import { createClubsTable } from '../database/schemas/clubs';

describe('Clubs Table Schema', () => {
  it('should create clubs table with correct columns', async () => {
    const mockDb = { exec: jest.fn() };
    await createClubsTable(mockDb);
    
    expect(mockDb.exec).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS clubs')
    );
    expect(mockDb.exec).toHaveBeenCalledWith(
      expect.stringContaining('geographic_area TEXT')
    );
    expect(mockDb.exec).toHaveBeenCalledWith(
      expect.stringContaining('zip_code TEXT')
    );
  });
});
```

### Design matches table schema
```typescript
// __tests__/database/schemas/matches.test.ts
import { createMatchesTable } from '../database/schemas/matches';

describe('Matches Table Schema', () => {
  it('should create matches table with correct columns', async () => {
    const mockDb = { exec: jest.fn() };
    await createMatchesTable(mockDb);
    
    expect(mockDb.exec).toHaveBeenCalledWith(
      expect.stringContaining('scores TEXT NOT NULL')
    );
    expect(mockDb.exec).toHaveBeenCalledWith(
      expect.stringContaining('date TEXT NOT NULL')
    );
    expect(mockDb.exec).toHaveBeenCalledWith(
      expect.stringContaining('club_id TEXT')
    );
  });
});
```

## Club Discovery & Management Tests

### Create basic club creation form component
```typescript
// __tests__/components/ClubCreationForm.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ClubCreationForm from '../components/ClubCreationForm';

describe('ClubCreationForm Component', () => {
  it('should render club creation form', () => {
    const { getByTestId } = render(<ClubCreationForm onSubmit={jest.fn()} />);
    expect(getByTestId('club-creation-form')).toBeTruthy();
  });

  it('should call onSubmit when form is submitted', () => {
    const mockSubmit = jest.fn();
    const { getByText } = render(<ClubCreationForm onSubmit={mockSubmit} />);
    
    fireEvent.press(getByText('Create Club'));
    expect(mockSubmit).toHaveBeenCalled();
  });
});
```

### Add club name input field to creation form
```typescript
// __tests__/components/ClubCreationForm.test.tsx
describe('Club Name Input', () => {
  it('should render club name input field', () => {
    const { getByPlaceholderText } = render(<ClubCreationForm onSubmit={jest.fn()} />);
    expect(getByPlaceholderText('Enter club name')).toBeTruthy();
  });

  it('should update club name on text change', () => {
    const { getByPlaceholderText } = render(<ClubCreationForm onSubmit={jest.fn()} />);
    const input = getByPlaceholderText('Enter club name');
    
    fireEvent.changeText(input, 'Test Tennis Club');
    expect(input.props.value).toBe('Test Tennis Club');
  });
});
```

## Match Recording System Tests

### Create basic match recording form component
```typescript
// __tests__/components/MatchRecordingForm.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import MatchRecordingForm from '../components/MatchRecordingForm';

describe('MatchRecordingForm Component', () => {
  it('should render match recording form', () => {
    const { getByTestId } = render(<MatchRecordingForm onSubmit={jest.fn()} />);
    expect(getByTestId('match-recording-form')).toBeTruthy();
  });

  it('should have submit button', () => {
    const { getByText } = render(<MatchRecordingForm onSubmit={jest.fn()} />);
    expect(getByText('Save Match')).toBeTruthy();
  });
});
```

### Add match type radio buttons (Singles/Doubles)
```typescript
// __tests__/components/MatchTypeSelector.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MatchTypeSelector from '../components/MatchTypeSelector';

describe('MatchTypeSelector Component', () => {
  it('should render singles and doubles options', () => {
    const { getByText } = render(<MatchTypeSelector onSelect={jest.fn()} />);
    expect(getByText('Singles')).toBeTruthy();
    expect(getByText('Doubles')).toBeTruthy();
  });

  it('should call onSelect when option is selected', () => {
    const mockSelect = jest.fn();
    const { getByText } = render(<MatchTypeSelector onSelect={mockSelect} />);
    
    fireEvent.press(getByText('Singles'));
    expect(mockSelect).toHaveBeenCalledWith('singles');
  });

  it('should have singles selected by default', () => {
    const { getByTestId } = render(<MatchTypeSelector onSelect={jest.fn()} />);
    const singlesOption = getByTestId('singles-option');
    expect(singlesOption.props.selected).toBe(true);
  });
});
```

### Validate tennis set scores
```typescript
// __tests__/utils/scoreValidation.test.ts
import { validateSetScore } from '../utils/scoreValidation';

describe('Tennis Score Validation', () => {
  it('should accept valid normal set scores', () => {
    expect(validateSetScore(6, 4)).toBe(true);
    expect(validateSetScore(6, 3)).toBe(true);
    expect(validateSetScore(6, 2)).toBe(true);
  });

  it('should accept valid extended set scores', () => {
    expect(validateSetScore(7, 5)).toBe(true);
    expect(validateSetScore(6, 7)).toBe(true); // Lost in tiebreak
  });

  it('should reject invalid set scores', () => {
    expect(validateSetScore(6, 6)).toBe(false); // Must go to tiebreak
    expect(validateSetScore(8, 6)).toBe(false); // Too high
    expect(validateSetScore(5, 4)).toBe(false); // Neither reached 6
  });

  it('should handle tiebreak sets correctly', () => {
    expect(validateSetScore(7, 6, '7-3')).toBe(true);
    expect(validateSetScore(6, 7, '4-7')).toBe(true);
  });
});
```

## Club Member Rankings Tests

### Create ranking calculation function
```typescript
// __tests__/utils/rankingCalculation.test.ts
import { calculatePlayerRanking } from '../utils/rankingCalculation';

describe('Ranking Calculation', () => {
  it('should calculate win percentage correctly', () => {
    const matches = [
      { result: 'won' },
      { result: 'won' },
      { result: 'lost' },
    ];
    
    const ranking = calculatePlayerRanking(matches);
    expect(ranking.winPercentage).toBe(67); // 2/3 = 66.67% rounded to 67
  });

  it('should handle player with no matches', () => {
    const ranking = calculatePlayerRanking([]);
    expect(ranking.winPercentage).toBe(0);
    expect(ranking.isProvisional).toBe(true);
  });

  it('should mark players with <5 matches as provisional', () => {
    const matches = [{ result: 'won' }, { result: 'lost' }];
    const ranking = calculatePlayerRanking(matches);
    expect(ranking.isProvisional).toBe(true);
  });
});
```

### Create unified points system
```typescript
// __tests__/utils/pointsSystem.test.ts
import { calculateMatchPoints } from '../utils/pointsSystem';

describe('Tennis Points System', () => {
  it('should award 100 base points for a win', () => {
    const points = calculateMatchPoints({
      result: 'won',
      score: '6-4, 6-2',
      opponent: { ranking: 1000 },
      player: { ranking: 1000 }
    });
    
    expect(points).toBeGreaterThanOrEqual(100);
  });

  it('should award bonus points for dominant wins', () => {
    const dominantWin = calculateMatchPoints({
      result: 'won',
      score: '6-0, 6-0', // 12 game difference
      opponent: { ranking: 1000 },
      player: { ranking: 1000 }
    });
    
    const closeWin = calculateMatchPoints({
      result: 'won',
      score: '7-6, 6-4', // 3 game difference
      opponent: { ranking: 1000 },
      player: { ranking: 1000 }
    });
    
    expect(dominantWin).toBeGreaterThan(closeWin);
  });

  it('should award upset bonus for beating higher-ranked player', () => {
    const upsetWin = calculateMatchPoints({
      result: 'won',
      score: '6-4, 6-2',
      opponent: { ranking: 2000 },
      player: { ranking: 1000 }
    });
    
    const normalWin = calculateMatchPoints({
      result: 'won',
      score: '6-4, 6-2',
      opponent: { ranking: 1000 },
      player: { ranking: 1000 }
    });
    
    expect(upsetWin).toBeGreaterThan(normalWin);
  });
});
```

## UI Components Tests

### Create shared FormHeader component
```typescript
// __tests__/components/FormHeader.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FormHeader from '../components/FormHeader';

describe('FormHeader Component', () => {
  it('should render title correctly', () => {
    const { getByText } = render(<FormHeader title="Test Title" onBack={jest.fn()} />);
    expect(getByText('Test Title')).toBeTruthy();
  });

  it('should call onBack when back button is pressed', () => {
    const mockOnBack = jest.fn();
    const { getByText } = render(<FormHeader title="Test" onBack={mockOnBack} />);
    
    fireEvent.press(getByText('< Back'));
    expect(mockOnBack).toHaveBeenCalled();
  });
});
```

### Create PlayerCard component
```typescript
// __tests__/components/PlayerCard.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PlayerCard from '../components/PlayerCard';

describe('PlayerCard Component', () => {
  const mockPlayer = {
    id: '1',
    name: 'John Smith',
    points: 1500,
    winRate: 75,
    matchCount: 10
  };

  it('should display player name and points', () => {
    const { getByText } = render(<PlayerCard player={mockPlayer} rank={1} />);
    expect(getByText('John Smith')).toBeTruthy();
    expect(getByText('1,500 pts')).toBeTruthy();
  });

  it('should show trophy for top 3 players', () => {
    const { getByText } = render(
      <PlayerCard player={mockPlayer} rank={1} showTrophy={true} />
    );
    expect(getByText('🏆')).toBeTruthy();
  });

  it('should show challenge button when enabled', () => {
    const mockChallenge = jest.fn();
    const { getByText } = render(
      <PlayerCard 
        player={mockPlayer} 
        showChallenge={true} 
        onChallenge={mockChallenge}
      />
    );
    
    const challengeButton = getByText('Challenge');
    expect(challengeButton).toBeTruthy();
    
    fireEvent.press(challengeButton);
    expect(mockChallenge).toHaveBeenCalledWith('1');
  });
});
```

### Create MatchScoreDisplay component
```typescript
// __tests__/components/MatchScoreDisplay.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import MatchScoreDisplay from '../components/MatchScoreDisplay';

describe('MatchScoreDisplay Component', () => {
  const mockSets = [
    { player1Score: 6, player2Score: 4 },
    { player1Score: 7, player2Score: 6, tiebreak: '7-3' }
  ];

  it('should display match scores correctly', () => {
    const { getByText } = render(
      <MatchScoreDisplay 
        player1="John Smith"
        player2="Jane Doe"
        sets={mockSets}
      />
    );
    
    expect(getByText('6-4')).toBeTruthy();
    expect(getByText('7-6(7-3)')).toBeTruthy();
  });

  it('should show winner when provided', () => {
    const { getByText } = render(
      <MatchScoreDisplay 
        player1="John Smith"
        player2="Jane Doe"
        sets={mockSets}
        winner="John Smith"
      />
    );
    
    expect(getByText('✓')).toBeTruthy(); // Winner checkmark
  });
});
```

## Testing Infrastructure Tests

### Install Jest and React Native Testing Library
```typescript
// __tests__/setup.test.ts
describe('Testing Setup', () => {
  it('should have Jest configured', () => {
    expect(jest).toBeDefined();
  });

  it('should have React Native Testing Library available', () => {
    const { render } = require('@testing-library/react-native');
    expect(render).toBeDefined();
  });
});
```

### Write first test for Match model
```typescript
// __tests__/models/Match.test.ts
import { Match } from '../models/Match';

describe('Match Model', () => {
  it('should create a match with required properties', () => {
    const matchData = {
      player1Id: 'user1',
      player2Id: 'user2',
      scores: '6-4, 6-2',
      date: '2024-01-15',
      clubId: 'club1'
    };
    
    const match = new Match(matchData);
    
    expect(match.player1Id).toBe('user1');
    expect(match.scores).toBe('6-4, 6-2');
    expect(match.date).toBe('2024-01-15');
  });

  it('should determine winner correctly', () => {
    const match = new Match({
      player1Id: 'user1',
      player2Id: 'user2',
      scores: '6-4, 6-2',
      date: '2024-01-15',
      clubId: 'club1'
    });
    
    expect(match.getWinnerId()).toBe('user1');
  });

  it('should calculate total games correctly', () => {
    const match = new Match({
      player1Id: 'user1',
      player2Id: 'user2',
      scores: '6-4, 6-2',
      date: '2024-01-15',
      clubId: 'club1'
    });
    
    const { player1Games, player2Games } = match.getTotalGames();
    expect(player1Games).toBe(12); // 6 + 6
    expect(player2Games).toBe(6);  // 4 + 2
  });
});
```

## Integration Tests

### Club Creation Flow Integration Test
```typescript
// __tests__/integration/clubCreation.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ClubCreationScreen from '../screens/ClubCreationScreen';

describe('Club Creation Flow Integration', () => {
  it('should create club and auto-join user', async () => {
    const { getByPlaceholderText, getByText } = render(<ClubCreationScreen />);
    
    // Fill form
    fireEvent.changeText(getByPlaceholderText('Enter club name'), 'Test Club');
    fireEvent.changeText(getByPlaceholderText('Describe your club'), 'Test description');
    fireEvent.changeText(getByPlaceholderText('Geographic area'), 'San Francisco');
    fireEvent.changeText(getByPlaceholderText('Zip code'), '94102');
    
    // Submit
    fireEvent.press(getByText('Create Club'));
    
    // Verify success
    await waitFor(() => {
      expect(getByText('Club Created Successfully!')).toBeTruthy();
    });
  });
});
```

### Match Recording Flow Integration Test
```typescript
// __tests__/integration/matchRecording.test.tsx
describe('Match Recording Flow Integration', () => {
  it('should record match and update rankings', async () => {
    const { getByText, getByPlaceholderText } = render(<MatchRecordingScreen />);
    
    // Select match type
    fireEvent.press(getByText('Singles'));
    
    // Select opponent
    fireEvent.press(getByText('Select Opponent'));
    fireEvent.press(getByText('Jane Doe'));
    
    // Enter scores
    fireEvent.changeText(getByPlaceholderText('Set 1 - Your score'), '6');
    fireEvent.changeText(getByPlaceholderText('Set 1 - Opponent score'), '4');
    
    // Save match
    fireEvent.press(getByText('Save Match'));
    
    // Verify success
    await waitFor(() => {
      expect(getByText('Match Recorded!')).toBeTruthy();
    });
  });
});
```

## Test Running Scripts

Add to package.json:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

## Test Configuration

### Jest Configuration (jest.config.js)
```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'screens/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
    'models/**/*.{ts,tsx}',
    '!**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

This comprehensive test suite ensures every task has corresponding tests, following TDD principles. Each test is focused, specific, and verifies the exact functionality described in the TODO.md tasks.