# Push Notifications & Real-time Features

## Overview
Complete implementation of push notifications and real-time updates for enhanced user engagement and immediate communication about tennis activities.

## Architecture

### Core Components

#### 1. PushNotificationService (`/services/pushNotificationService.ts`)
- **Singleton pattern** for centralized notification management
- **Permission handling** with proper iOS/Android support
- **Notification categories** for actionable notifications
- **Token management** with Supabase integration
- **Action handlers** for challenge and match invitation responses

#### 2. RealtimeService (`/services/realtimeService.ts`) 
- **Supabase Realtime** subscriptions for live updates
- **User-specific channels** for targeted notifications
- **Club activity monitoring** across user's memberships
- **Automatic cleanup** on user sign out

#### 3. NotificationListener (`/hooks/useNotificationListener.ts`)
- **Foreground notification handling**
- **Deep linking** from notification interactions
- **Navigation routing** based on notification types

## Features Implemented

### ✅ Push Notification Infrastructure
- **expo-notifications** configuration with proper permissions
- **Device detection** and token generation
- **Notification channels** for Android (tennis-notifications)
- **Badge management** and sound configuration
- **Local notification scheduling**

### ✅ Real-time Subscriptions
- **Challenge notifications**: New challenges, status updates
- **Match invitations**: "Looking to Play" notifications and responses  
- **Match results**: Automatic notifications when matches are recorded
- **Club activities**: Real-time updates for user's club memberships

### ✅ Actionable Notifications
- **Challenge notifications** with Accept/Decline buttons
- **Match invitations** with Join action
- **Background processing** without opening the app
- **Service integration** with existing challenge/match systems

### ✅ Deep Linking & Navigation
- **Automatic navigation** from notification taps
- **Context-aware routing** based on notification type
- **Proper screen focus** for relevant features

## Notification Types

### 1. Challenge Notifications
```typescript
{
  type: 'challenge',
  title: 'New Challenge!',
  body: 'You've been challenged to a singles match',
  data: {
    challengeId: string,
    challengerId: string,
    challengedId: string,
    clubId: string,
    matchType: 'singles' | 'doubles'
  }
}
```

**Actions Available:**
- ✅ **Accept**: Automatically accepts challenge via challengeService
- ✅ **Decline**: Automatically declines challenge via challengeService

### 2. Match Invitation Notifications
```typescript
{
  type: 'match_invitation',
  title: 'Looking to Play!',
  body: 'Someone is looking for a doubles partner',
  data: {
    invitationId: string,
    clubId: string,
    matchType: 'singles' | 'doubles',
    date: string,
    userId: string
  }
}
```

**Actions Available:**
- ✅ **Join Match**: Responds to invitation via matchInvitationService

### 3. Match Result Notifications
```typescript
{
  type: 'match_result',
  title: 'Match Recorded!',
  body: 'Your match with Mike Chen has been recorded',
  data: {
    matchId: string,
    clubId: string,
    date: string
  }
}
```

### 4. Ranking Update Notifications
```typescript
{
  type: 'ranking_update',  
  title: 'Ranking Update!',
  body: 'You moved up to #3 in Downtown Tennis Club',
  data: {
    clubId: string,
    newRank: number,
    oldRank: number
  }
}
```

## Integration Points

### AuthContext Integration
- **Automatic initialization** when user signs in
- **Token registration** and Supabase metadata sync
- **Cleanup on sign out** to prevent memory leaks

### Service Integration  
- **Challenge System**: Direct integration with accept/decline methods
- **Match Invitations**: Response handling via existing service methods
- **Sync Queue**: Works with offline-first architecture

### Real-time Database Triggers
- **PostgreSQL triggers** via Supabase Realtime
- **Filtered subscriptions** for user-relevant updates only
- **Club-based filtering** for contextual notifications

## Configuration

### App Configuration (`app.json`)
```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#007AFF", 
          "defaultChannel": "tennis-notifications"
        }
      ]
    ]
  }
}
```

### Environment Variables
```env
# Optional: For production push notifications
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
```

## Testing

### Test Utilities (`/utils/testNotifications.ts`)
- **testNotifications()**: Send sample notifications of all types
- **testNotificationPermissions()**: Verify permission setup
- **testNotificationCategories()**: Test actionable notifications

### Manual Testing
```typescript
import { testNotifications } from '@/utils/testNotifications';

// In development console or component
await testNotifications();
```

## Production Considerations

### Performance
- **Efficient subscriptions** with proper cleanup
- **Filtered real-time queries** to minimize bandwidth
- **Token refresh handling** for long-running sessions

### Privacy & Permissions
- **Explicit permission requests** with clear explanations
- **User control** over notification types (future enhancement)
- **Token security** with proper Supabase integration

### Reliability
- **Offline tolerance** with notification queuing
- **Error handling** for failed deliveries
- **Graceful degradation** when notifications unavailable

## Future Enhancements

### Planned Features
- [ ] **User notification preferences** for granular control
- [ ] **Push notification scheduling** for match reminders
- [ ] **Rich notifications** with images and custom layouts
- [ ] **Notification history** and read status tracking
- [ ] **Group notifications** for club-wide announcements

### Analytics Integration
- [ ] **Notification engagement tracking**
- [ ] **Action success rates** for optimization
- [ ] **User preference analysis**

## Debugging

### Common Issues
1. **Permissions denied**: Check device settings and re-request
2. **Token not generated**: Verify Expo project configuration  
3. **Actions not working**: Check service method integration
4. **Real-time not triggering**: Verify Supabase subscription filters

### Debug Commands
```bash
# Test notification setup
npx expo start
# Open dev tools and test notifications

# Check push token generation
console.log(pushNotificationService.getPushToken());

# Monitor real-time subscriptions
console.log(realtimeService.getActiveSubscriptions());
```

## Architecture Benefits

### Real-time Engagement
- **Immediate notifications** for time-sensitive tennis activities
- **Reduced app checking** - users notified proactively
- **Social engagement** through challenge and invitation systems

### Offline-First Compatible
- **Works with sync queue** for offline scenarios
- **Local notifications** when network unavailable
- **Seamless online/offline transitions**

### Scalable Design
- **Service separation** for maintainability
- **Plugin architecture** for easy feature additions
- **Type-safe implementation** with full TypeScript support

This implementation provides a comprehensive foundation for real-time tennis app engagement while maintaining the offline-first architecture and ensuring reliable, actionable notifications for all core user interactions.